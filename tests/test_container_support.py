"""Local tests of the container gate; these do not claim a Docker build passed."""
import copy
from pathlib import Path
import sqlite3
import tempfile
import unittest

from curriculum import catalog
from scripts.restore import restore
from store import Store

try:
    import container_support as support
except ImportError:
    support = None


class ContainerSupport(unittest.TestCase):
    def setUp(self):
        self.assertIsNotNone(support, 'Container acceptance helpers are missing')
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)

    def store_with_progress(self):
        store = Store(self.root / 'source' / 'progress.sqlite3')
        events = support.synthetic_events(store.state(), catalog())
        self.assertEqual(len(events), 3)
        for event in events:
            store.submit(event)
        return store, events

    def test_synthetic_events_are_valid_progressive_events_and_idempotent(self):
        store, events = self.store_with_progress()
        for event in events:
            store.submit(event)
        support.check_progress(store.state())
        self.assertEqual(store.state()['courses']['sprout-3']['positions']['1'], 3)
        self.assertEqual(store.state()['positions']['1'], 0)
        self.assertEqual(store.state()['mastery']['confirmed'], 0)
        self.assertEqual([e['id'] for e in events], ['container-synthetic-0', 'container-synthetic-1', 'container-synthetic-2'])

    def test_lost_progress_does_not_pass_as_healthy(self):
        store, _ = self.store_with_progress()
        bad = store.state()
        bad['courses']['sprout-3']['positions']['1'] = 0
        with self.assertRaises(AssertionError):
            support.check_progress(bad)

    def test_backup_restore_preserves_all_event_rows_and_changes_only_generation(self):
        store, events = self.store_with_progress()
        backup = self.root / 'backup.sqlite3'
        store.backup(backup)
        before = support.database_facts(backup)
        self.assertEqual(len(before['events']), 3)
        target = self.root / 'restored' / 'progress.sqlite3'
        restore(backup, target, 'RESTORE')
        after = support.database_facts(target)
        self.assertEqual(before, after)
        restored = Store(target).state()
        self.assertNotEqual(restored['generation'], store.state()['generation'])
        self.assertEqual(support.progress_facts(restored), support.progress_facts(store.state()))
        self.assertEqual(support.database_facts(backup), before)

    def test_invalid_or_changed_backup_is_not_accepted(self):
        store, _ = self.store_with_progress()
        backup = self.root / 'backup.sqlite3'
        store.backup(backup)
        with sqlite3.connect(backup) as db:
            db.execute("UPDATE events SET mode='tampered'")
        with self.assertRaises(ValueError):
            support.database_facts(backup)

    def safe_inspect(self):
        return {
            'Config': {'User': '1001:1001'},
            'HostConfig': {'ReadonlyRootfs': True, 'CapDrop': ['ALL'], 'CapAdd': None,
                           'Privileged': False, 'SecurityOpt': ['no-new-privileges:true'],
                           'Tmpfs': {'/tmp': 'size=32m,mode=1777'},
                           'NetworkMode': 'bridge',
                           'PortBindings': {'8080/tcp': [{'HostIp': '127.0.0.1', 'HostPort': ''}]}},
            'Mounts': [{'Type': 'bind', 'Source': str(self.root), 'Destination': '/data', 'RW': True}],
            'NetworkSettings': {'Ports': {'8080/tcp': [{'HostIp': '127.0.0.1', 'HostPort': '49152'}]}}
        }

    def test_inspect_accepts_hardened_loopback_and_rejects_each_regression(self):
        good = self.safe_inspect()
        self.assertEqual(support.check_container(good, self.root, 1001, 1001), 49152)
        changes = [
            ('Config', 'User', '0:0'), ('HostConfig', 'ReadonlyRootfs', False),
            ('HostConfig', 'CapDrop', []), ('HostConfig', 'CapAdd', ['SYS_ADMIN']),
            ('HostConfig', 'Privileged', True), ('HostConfig', 'SecurityOpt', []),
            ('HostConfig', 'Tmpfs', {}), ('HostConfig', 'NetworkMode', 'host'),
            ('HostConfig', 'PortBindings', {'8080/tcp': [{'HostIp': '0.0.0.0', 'HostPort': '8080'}]}),
            ('NetworkSettings', 'Ports', {'8080/tcp': [{'HostIp': '0.0.0.0', 'HostPort': '49152'}]}),
        ]
        for section, key, value in changes:
            with self.subTest(section=section, key=key):
                bad = copy.deepcopy(good); bad[section][key] = value
                with self.assertRaises(AssertionError):
                    support.check_container(bad, self.root, 1001, 1001)
        bad = copy.deepcopy(good); bad['Mounts'][0]['Source'] = '/unrelated'
        with self.assertRaises(AssertionError):
            support.check_container(bad, self.root, 1001, 1001)

    def test_resource_names_reject_unscoped_cleanup(self):
        token = '123-1-abcdef123456'
        self.assertEqual(support.resource_name(token, 'source'), 'literacy-container-123-1-abcdef123456-source')
        for invalid in ['', '../other', 'main', '123; rm -rf /', '123-1-ABCDEF123456']:
            with self.subTest(invalid=invalid), self.assertRaises(ValueError):
                support.resource_name(invalid, 'source')
        with self.assertRaises(ValueError):
            support.resource_name(token, '../other')

    def test_live_security_rejects_root_capabilities_or_writable_root(self):
        good = {'uid': 1001, 'gid': 1001, 'rootfs_read_only': True,
                'cap_eff': 0, 'cap_bnd': 0, 'no_new_privs': 1,
                'restore_available': True, 'timezone_available': True}
        self.assertTrue(callable(getattr(support, 'check_live_security', None)), 'Live security validation is missing')
        support.check_live_security(good, 1001, 1001)
        for key, value in [('uid', 0), ('gid', 0), ('rootfs_read_only', False),
                           ('cap_eff', 1), ('cap_bnd', 1), ('no_new_privs', 0),
                           ('restore_available', False), ('timezone_available', False)]:
            with self.subTest(key=key), self.assertRaises(AssertionError):
                support.check_live_security(dict(good, **{key: value}), 1001, 1001)

    def test_environment_guard_refuses_local_root_and_non_amd64_execution(self):
        env = {'GITHUB_ACTIONS': 'true', 'RUNNER_OS': 'Linux',
               'GITHUB_RUN_ID': '123', 'GITHUB_RUN_ATTEMPT': '1',
               'GITHUB_SHA': 'a' * 40}
        self.assertTrue(callable(getattr(support, 'check_environment', None)), 'Environment guard is missing')
        support.check_environment(env, 1001, 1001, 'x86_64')
        for changes, uid, gid, arch in [({}, 0, 1001, 'x86_64'),
                                       ({}, 1001, 0, 'x86_64'),
                                       ({}, 1001, 1001, 'aarch64'),
                                       ({'GITHUB_ACTIONS': 'false'}, 1001, 1001, 'x86_64'),
                                       ({'GITHUB_SHA': 'main'}, 1001, 1001, 'x86_64'),
                                       ({'GITHUB_RUN_ID': '../x'}, 1001, 1001, 'x86_64')]:
            with self.subTest(changes=changes, uid=uid, arch=arch), self.assertRaises(ValueError):
                support.check_environment(dict(env, **changes), uid, gid, arch)

    def test_cleanup_refuses_foreign_paths_and_keeps_data_until_containers_removed(self):
        self.assertTrue(callable(getattr(support, 'remove_owned_directory', None)), 'Scoped directory cleanup is missing')
        token = '123-1-abcdef123456'
        owned = Path(tempfile.mkdtemp(prefix=f'literacy-container-{token}-'))
        self.addCleanup(lambda: __import__('shutil').rmtree(owned, ignore_errors=True))
        marker = owned / 'synthetic.txt'; marker.write_text('synthetic')
        self.assertFalse(support.remove_owned_directory(owned, token, containers_removed=False))
        self.assertEqual(marker.read_text(), 'synthetic')
        for foreign in (self.root, owned.parent, owned):
            with self.subTest(foreign=foreign), self.assertRaises(ValueError):
                support.remove_owned_directory(foreign, '999-1-abcdef123456', containers_removed=True)
        self.assertTrue(support.remove_owned_directory(owned, token, containers_removed=True))
        self.assertFalse(owned.exists())

    def test_calendar_comparison_ignores_response_time_but_detects_lost_history(self):
        self.assertTrue(callable(getattr(support, 'calendar_facts', None)), 'Stable calendar comparison is missing')
        store, _ = self.store_with_progress()
        before = store.calendar('2024-02', course_version='sprout-3')
        after = copy.deepcopy(before)
        after['updated_at'] = '2030-01-02T00:00:00+08:00'
        after['today'] = '2030-01-02'
        self.assertEqual(before['days'][27]['steps'], 3)
        self.assertEqual(support.calendar_facts(before), support.calendar_facts(after))
        after['days'][27]['steps'] = 0
        self.assertNotEqual(support.calendar_facts(before), support.calendar_facts(after))

    def test_pinned_build_recipe_retains_existing_base_and_all_runtime_copies(self):
        recipe = (Path(__file__).resolve().parents[1] / 'Dockerfile').read_text()
        digest = 'python@sha256:' + 'a' * 64
        pinned = support.pinned_recipe(recipe, digest)
        self.assertEqual(pinned.splitlines()[0], 'FROM ' + digest)
        self.assertEqual(pinned.splitlines()[1:], recipe.splitlines()[1:])
        for invalid in ['other@sha256:' + 'a' * 64, 'python:latest', 'python@sha256:bad']:
            with self.assertRaises(ValueError):
                support.pinned_recipe(recipe, invalid)
        with self.assertRaises(ValueError):
            support.pinned_recipe(recipe.replace('python:3.12-slim', 'python:latest'), digest)


if __name__ == '__main__':
    unittest.main()
