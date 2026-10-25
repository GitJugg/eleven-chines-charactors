"""Assertions shared by local gate tests and real Docker acceptance.

Only anonymous synthetic records belong in this test harness. Docker inspection
and database contents stay in memory or temporary files, never CI artifacts.
"""
import json
from pathlib import Path
import re
import sqlite3

from store import validate_database


BASE_TAG = 'python:3.12-slim'
OWNER_LABEL = 'org.sprout.container-acceptance'


def resource_name(token, role):
    if not re.fullmatch(r'[0-9]+-[0-9]+-[a-f0-9]{12}', token):
        raise ValueError('Invalid test resource token')
    if role not in ('source', 'restored', 'restore'):
        raise ValueError('Invalid test resource role')
    return f'literacy-container-{token}-{role}'


def pinned_recipe(recipe, digest):
    if not re.fullmatch(r'(?:docker.io/library/)?python@sha256:[a-f0-9]{64}', digest):
        raise ValueError('Expected the official Python image digest')
    lines = recipe.splitlines()
    if not lines or lines[0] != 'FROM ' + BASE_TAG or sum(line.startswith('FROM ') for line in lines) != 1:
        raise ValueError('Dockerfile base changed; review the container gate')
    return '\n'.join(['FROM ' + digest, *lines[1:]]) + '\n'


def synthetic_events(state, course):
    advanced = next(c for c in course['courses'] if c['version'] == 'sprout-3')
    return [dict(id=f'container-synthetic-{step}', course_version='sprout-3',
                 lesson_id=advanced['days'][0]['id'], run_id='main', step=step,
                 answer=task.get('answer'), mode='adult',
                 occurred_at='2024-02-28T12:00:00+00:00', client_timezone='UTC',
                 generation=state['generation'])
            for step, task in enumerate(advanced['lessons']['1'][:3])]


def check_progress(state):
    assert state['schema_version'] == 3, 'Unexpected database schema'
    assert state['courses']['sprout-3']['positions']['1'] == 3, 'Synthetic progress was lost'
    assert all(n == 0 for n in state['courses']['sprout-2']['positions'].values()), 'Foundation progress changed'
    assert state['mastery']['confirmed'] == 0, 'Progress must not imply mastery'
    assert len(state['runs']) == 1 and state['runs'][0]['position'] == 3, 'Unexpected event run'


def progress_facts(state):
    # Exclude the recovery generation and moving current-day calendar summary.
    # The fixed synthetic activity date and all event rows are checked separately.
    return {key: state[key] for key in (
        'version', 'schema_version', 'courses', 'runs', 'positions', 'stats',
        'rewards', 'settings', 'mastery', 'contacted_characters')}


def database_facts(path):
    meta = validate_database(path)
    with sqlite3.connect(Path(path).resolve().as_uri() + '?mode=ro', uri=True) as db:
        return {'events': db.execute('SELECT * FROM events ORDER BY rowid').fetchall(),
                'rewards': db.execute('SELECT * FROM rewards ORDER BY course_version,day').fetchall(),
                'settings': json.loads(meta['settings']), 'timezone': meta['activity_timezone']}


def check_container(info, data_dir, uid, gid):
    host = info['HostConfig']
    assert uid > 0 and gid > 0 and info['Config']['User'] == f'{uid}:{gid}', 'Container must run unprivileged'
    assert host['ReadonlyRootfs'] is True, 'Root filesystem must be read-only'
    assert {v.upper() for v in host['CapDrop']} == {'ALL'} and not host.get('CapAdd'), 'Capabilities must be dropped'
    assert host.get('Privileged') is False, 'Privileged containers are forbidden'
    assert any(v in ('no-new-privileges', 'no-new-privileges:true') for v in host['SecurityOpt']), 'No-new-privileges missing'
    assert host['Tmpfs'].get('/tmp') == 'size=32m,mode=1777', 'Expected bounded temporary filesystem'
    assert host['NetworkMode'] == 'bridge', 'Unexpected app network mode'
    mounts = [m for m in info['Mounts'] if m['Type'] != 'tmpfs']
    assert len(mounts) == 1, 'Only the dedicated data bind is allowed'
    mount = mounts[0]
    assert mount['Type'] == 'bind' and mount['Destination'] == '/data' and mount['RW'] is True, 'Unexpected data mount'
    assert Path(mount['Source']).resolve() == Path(data_dir).resolve(), 'Data directory mismatch'
    for ports in (host['PortBindings'], info['NetworkSettings']['Ports']):
        assert set(ports) == {'8080/tcp'}, 'Unexpected published port'
        assert len(ports['8080/tcp']) == 1 and ports['8080/tcp'][0]['HostIp'] == '127.0.0.1', 'Only loopback publishing is allowed'
    port = int(info['NetworkSettings']['Ports']['8080/tcp'][0]['HostPort'])
    assert 1 <= port <= 65535, 'No usable HTTP port'
    return port


def check_live_security(info, uid, gid):
    assert info == {'uid': uid, 'gid': gid, 'rootfs_read_only': True,
                    'cap_eff': 0, 'cap_bnd': 0, 'no_new_privs': 1,
                    'restore_available': True, 'timezone_available': True}, 'Runtime hardening or restore dependencies are missing'
    assert uid > 0 and gid > 0, 'Root execution is forbidden'


def check_environment(env, uid, gid, machine):
    if env.get('GITHUB_ACTIONS') != 'true' or env.get('RUNNER_OS') != 'Linux':
        raise ValueError('Real container acceptance is restricted to GitHub Linux CI')
    if uid <= 0 or gid <= 0 or machine != 'x86_64':
        raise ValueError('Expected an unprivileged native amd64 runner')
    for key in ('GITHUB_RUN_ID', 'GITHUB_RUN_ATTEMPT'):
        if not re.fullmatch(r'[0-9]+', env.get(key, '')):
            raise ValueError('Invalid CI run identifier')
    if not re.fullmatch(r'[a-f0-9]{40}', env.get('GITHUB_SHA', '')):
        raise ValueError('Expected an immutable CI source commit')


def remove_owned_directory(path, token, containers_removed):
    import shutil
    import tempfile
    resource_name(token, 'source')  # Validate the token before constructing a scope.
    path = Path(path)
    if (path.is_symlink() or path.parent.resolve() != Path(tempfile.gettempdir()).resolve()
            or not re.fullmatch(re.escape(f'literacy-container-{token}-') + r'[a-z0-9_]{6,16}', path.name)):
        raise ValueError('Refusing cleanup outside the owned temporary directory')
    if not containers_removed:
        return False  # Keep mounted data if precise container cleanup could not be verified.
    shutil.rmtree(path)
    return True


def calendar_facts(calendar):
    # HTTP response time/current day are not persisted learning history.
    return {key: calendar[key] for key in ('month', 'timezone', 'leading_empty', 'days', 'time_note')}
