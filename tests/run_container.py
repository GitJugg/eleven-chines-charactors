"""Real, fail-closed Docker acceptance on a disposable native amd64 CI runner.

No deployment, registry push, credentials, real records or host reconfiguration.
The only artifact is an allowlisted summary, written after successful cleanup.
"""
import hashlib
import json
import os
from pathlib import Path
import platform
import shutil
import signal
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from container_support import (BASE_TAG, OWNER_LABEL, calendar_facts, check_container,
                               check_environment, check_live_security,
                               check_progress, database_facts, pinned_recipe,
                               progress_facts, remove_owned_directory, resource_name, synthetic_events)

SELF_CHECK = r'''
import json, os, runpy
from pathlib import Path
from zoneinfo import ZoneInfo
readonly = bool(os.statvfs('/').f_flag & os.ST_RDONLY)
status = dict(line.split(':', 1) for line in Path('/proc/self/status').read_text().splitlines() if ':' in line)
restore = runpy.run_path('/app/scripts/restore.py', run_name='container_restore_check')
print(json.dumps(dict(uid=os.getuid(), gid=os.getgid(), rootfs_read_only=readonly,
                     cap_eff=int(status['CapEff'].strip(), 16),
                     cap_bnd=int(status['CapBnd'].strip(), 16),
                     no_new_privs=int(status['NoNewPrivs'].strip()),
                     restore_available=callable(restore.get('restore')),
                     timezone_available=ZoneInfo('Asia/Shanghai').key == 'Asia/Shanghai')))
'''


def command(args, timeout=60, check=True, cwd=ROOT):
    # Capture raw CLI output: never publish inspect paths, database data, or logs.
    result = subprocess.run(args, cwd=cwd, text=True, capture_output=True, timeout=timeout)
    if check and result.returncode:
        raise RuntimeError(f'Command failed with exit code {result.returncode}')
    return result


def docker(*args, timeout=60):
    return command(['docker', *args], timeout=timeout).stdout.strip()


def inspect(name):
    return json.loads(docker('inspect', name))[0]


def request(port, path, body=None, raw=False):
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(f'http://127.0.0.1:{port}{path}', data=data,
                                 headers={'Content-Type': 'application/json'})
    # Do not send localhost traffic through inherited proxy settings.
    with urllib.request.build_opener(urllib.request.ProxyHandler({})).open(req, timeout=5) as response:
        assert response.status == 200, 'HTTP request did not succeed'
        payload = response.read()
    return payload if raw else json.loads(payload)


def wait_ready(name, data, uid, gid):
    deadline = time.monotonic() + 75
    while time.monotonic() < deadline:
        info = inspect(name)
        assert info['State']['Running'], 'Test container exited before readiness'
        port = check_container(info, data, uid, gid)
        try:
            if request(port, '/api/health') == {'ok': True} and info['State']['Health']['Status'] == 'healthy':
                return port
        except (urllib.error.URLError, TimeoutError, ConnectionError):
            pass
        time.sleep(1)
    raise RuntimeError('HTTP and Docker healthcheck readiness timed out')


def file_hash(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def interrupted(signum, frame):
    raise InterruptedError('Container acceptance interrupted')


def main():
    stage = 'environment preflight'
    created = []
    image_tag = None
    token = None
    summary = None
    work = None
    cleanup_failed = False
    try:
        if sys.flags.optimize:
            raise ValueError('Acceptance assertions cannot run with Python optimization')
        uid, gid = os.getuid(), os.getgid()
        check_environment(os.environ, uid, gid, platform.machine())
        if not shutil.which('docker'):
            raise ValueError('Docker CLI missing; acceptance cannot be skipped')
        assert docker('version', '--format', '{{.Server.Os}}/{{.Server.Arch}}') == 'linux/amd64', 'Expected a native Linux amd64 Docker daemon'
        head = command(['git', 'rev-parse', 'HEAD']).stdout.strip()
        assert head == os.environ['GITHUB_SHA'], 'Checkout is not the requested immutable commit'
        assert not command(['git', 'status', '--porcelain']).stdout.strip(), 'Build source must be clean'
        token = f"{os.environ['GITHUB_RUN_ID']}-{os.environ['GITHUB_RUN_ATTEMPT']}-{uuid.uuid4().hex[:12]}"
        resource_name(token, 'source')
        signal.signal(signal.SIGTERM, interrupted)
        signal.signal(signal.SIGINT, interrupted)
        work = Path(tempfile.mkdtemp(prefix=f'literacy-container-{token}-'))
        source = work / 'source'; source.mkdir(mode=0o700)
        restored = work / 'restored'; restored.mkdir(mode=0o700)
        for directory in (source, restored):
            assert directory.stat().st_uid == uid and directory.stat().st_gid == gid, 'Bind ownership does not match the unprivileged process'
        stage = 'resolve official base and build immutable checkout'
        docker('pull', '--platform', 'linux/amd64', BASE_TAG, timeout=180)
        base = json.loads(docker('image', 'inspect', BASE_TAG))[0]
        assert (base['Os'], base['Architecture']) == ('linux', 'amd64'), 'Unexpected base architecture'
        digest = next(d for d in base['RepoDigests'] if d.startswith(('python@sha256:', 'docker.io/library/python@sha256:')))
        recipe = work / 'Dockerfile'
        recipe.write_text(pinned_recipe((ROOT / 'Dockerfile').read_text(), digest))
        image_tag = f'literacy-container-check:{token}'
        docker('build', '--no-cache', '--pull=false', '--platform', 'linux/amd64',
               '--label', f'{OWNER_LABEL}={token}', '--file', str(recipe), '--tag', image_tag, '.', timeout=480)
        image = json.loads(docker('image', 'inspect', image_tag))[0]
        assert (image['Os'], image['Architecture']) == ('linux', 'amd64'), 'Unexpected built architecture'
        assert image['Config']['Labels'][OWNER_LABEL] == token, 'Image ownership label missing'

        def create(role, directory, offline=False, backup=None):
            name = resource_name(token, role)
            options = ['create', '--name', name, '--label', f'{OWNER_LABEL}={token}',
                       '--user', f'{uid}:{gid}', '--read-only', '--cap-drop', 'ALL',
                       '--security-opt', 'no-new-privileges:true',
                       '--tmpfs', '/tmp:size=32m,mode=1777', '--stop-timeout', '20',
                       '--env', 'DATA_DIR=/data', '--env', 'APP_TIMEZONE=Asia/Shanghai',
                       '--mount', f'type=bind,src={directory},dst=/data']
            if offline:
                options += ['--network', 'none', '--no-healthcheck', '--mount',
                            f'type=bind,src={backup},dst=/backup.sqlite3,readonly']
            else:
                options += ['--network', 'bridge', '--publish', '127.0.0.1::8080']
            # Register before create so an interruption cannot orphan our labelled container.
            created.append(name)
            options += [image_tag]
            if offline:
                options += ['python', 'scripts/restore.py', '/backup.sqlite3',
                            '--data-dir', '/data', '--confirm', 'RESTORE']
            docker(*options)
            return name

        try:
            stage = 'hardened runtime and actual healthchecks'
            primary = create('source', source)
            docker('start', primary)
            port = wait_ready(primary, source, uid, gid)
            runtime = json.loads(docker('exec', primary, 'python', '-c', SELF_CHECK))
            check_live_security(runtime, uid, gid)
            initial = request(port, '/api/state')
            assert all(n == 0 for course in initial['courses'].values() for n in course['positions'].values()), 'Dedicated test directory was not empty'
            course = request(port, '/api/course')
            assert {c['version'] for c in course['courses']} == {'sprout-2', 'sprout-3'}, 'Course API content missing'
            stage = 'write real synthetic progressive HTTP events'
            events = synthetic_events(initial, course)
            assert len(events) == 3, 'No synthetic cases generated'
            for event in events:
                request(port, '/api/event', event)
            request(port, '/api/event', events[0])  # Same ID and content must not add a row.
            expected = request(port, '/api/state'); check_progress(expected)
            calendar = calendar_facts(request(port, '/api/calendar?month=2024-02&course_version=sprout-3'))
            assert calendar['days'][27]['steps'] == 3, 'Synthetic activity date is missing'
            before_backup = work / 'before-restart.sqlite3'
            before_backup.write_bytes(request(port, '/api/backup', raw=True))
            facts = database_facts(before_backup)
            assert len(facts['events']) == 3, 'Incorrect persisted event count'
            assert [json.loads(row[1]) for row in facts['events']] == events, 'Persisted event payloads changed'
            stage = 'restart same container and verify persisted records'
            before = inspect(primary)
            docker('restart', '--time', '20', primary, timeout=45)
            port = wait_ready(primary, source, uid, gid)
            after = inspect(primary)
            assert before['Id'] == after['Id'] and before['State']['StartedAt'] != after['State']['StartedAt'], 'Container restart not observed'
            state = request(port, '/api/state'); check_progress(state)
            assert state['generation'] == expected['generation'], 'Restart changed database generation'
            assert progress_facts(state) == progress_facts(expected), 'State lost across restart'
            assert calendar_facts(request(port, '/api/calendar?month=2024-02&course_version=sprout-3')) == calendar, 'Activity history lost across restart'
            backup = work / 'backup.sqlite3'
            backup.write_bytes(request(port, '/api/backup', raw=True))
            assert database_facts(backup) == facts, 'Event history changed across restart'
            docker('stop', '--time', '20', primary, timeout=45)
            source_hash = file_hash(source / 'progress.sqlite3')
            backup_hash = file_hash(backup)
            stage = 'offline restore into second empty bind directory'
            assert not list(restored.iterdir()), 'Restore target must be empty'
            restorer = create('restore', restored, offline=True, backup=backup)
            docker('start', '--attach', restorer, timeout=60)
            assert inspect(restorer)['State']['ExitCode'] == 0, 'Offline restore process failed'
            assert file_hash(source / 'progress.sqlite3') == source_hash, 'Restore altered the original source'
            assert file_hash(backup) == backup_hash, 'Restore altered the selected backup'
            assert database_facts(restored / 'progress.sqlite3') == facts, 'Restored database differs from backup'
            stage = 'boot restored image and verify HTTP progress'
            secondary = create('restored', restored)
            docker('start', secondary)
            restored_port = wait_ready(secondary, restored, uid, gid)
            check_live_security(json.loads(docker('exec', secondary, 'python', '-c', SELF_CHECK)), uid, gid)
            state = request(restored_port, '/api/state'); check_progress(state)
            assert state['generation'] != expected['generation'], 'Restore did not refresh generation'
            assert progress_facts(state) == progress_facts(expected), 'Restored HTTP state differs'
            assert calendar_facts(request(restored_port, '/api/calendar?month=2024-02&course_version=sprout-3')) == calendar, 'Restored activity history differs'
            assert file_hash(source / 'progress.sqlite3') == source_hash, 'Original data was modified'
            assert file_hash(backup) == backup_hash, 'Backup was modified'
            summary = dict(status='passed', source_commit=head, platform='linux/amd64',
                           base_tag=BASE_TAG, base_digest=digest, base_image_id=base['Id'],
                           image_id=image['Id'], runtime_uid=uid, runtime_gid=gid,
                           synthetic_event_count=3, checks=['http_health_and_course',
                           'nonroot_readonly_capdrop_no_new_privileges', 'runtime_restore_dependencies',
                           'synthetic_event_history', 'same_container_restart_persistence',
                           'offline_restore_to_empty_directory', 'restored_http_state',
                           'source_and_backup_unchanged'], nas_acceptance=False)
        finally:
            # Do not remove bind data until every owned container is confirmed removed.
            cleanup_failed = True
            all_removed = True
            stage = 'precise resource cleanup' if summary else stage
            for name in reversed(created):
                result = command(['docker', 'inspect', name], check=False)
                if result.returncode:
                    # A failed create may have left no resource. Other daemon errors fail closed.
                    if 'No such object' not in result.stderr:
                        all_removed = False
                    continue
                info = json.loads(result.stdout)[0]
                if info['Name'] != '/' + name or info['Config'].get('Labels', {}).get(OWNER_LABEL) != token:
                    all_removed = False
                    continue
                if command(['docker', 'rm', '--force', name], check=False).returncode:
                    all_removed = False
            cleanup_failed = not all_removed
            if cleanup_failed:
                raise RuntimeError('Could not verify cleanup of owned containers')
        stage = 'image cleanup'
    except Exception as error:
        print(f'Container acceptance FAILED at {stage} ({type(error).__name__}). No acceptance summary produced.', file=sys.stderr)
        return 1
    finally:
        if image_tag:
            result = command(['docker', 'image', 'inspect', image_tag], check=False)
            if result.returncode == 0:
                image = json.loads(result.stdout)[0]
                if image['Config'].get('Labels', {}).get(OWNER_LABEL) == token:
                    cleanup_failed |= command(['docker', 'image', 'rm', image_tag], check=False).returncode != 0
                else:
                    cleanup_failed = True
            elif summary is not None:
                cleanup_failed = True  # A completed run must verify image ownership/removal.
        if work is not None:
            remove_owned_directory(work, token, containers_removed=not cleanup_failed)
    if cleanup_failed or not summary:
        print('Container acceptance FAILED: cleanup or scenario incomplete.', file=sys.stderr)
        return 1
    summary['cleanup_verified'] = True
    output = ROOT / 'evidence' / 'container' / 'summary.json'
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(summary, indent=2) + '\n')
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())
