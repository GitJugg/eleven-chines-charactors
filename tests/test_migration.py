import json, sqlite3, tempfile, unittest
from pathlib import Path
from store import Store
from course import lesson
from helpers import legacy_database, event

class Migration(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.path=Path(self.tmp.name)/'progress.db'
    def test_backup_before_migration_and_reopen_is_idempotent(self):
        legacy_database(self.path,len(lesson(1)))
        original=sqlite3.connect(self.path).iterdump(); original_dump='\n'.join(original); s=Store(self.path)
        st=s.state(); self.assertEqual(st['schema_version'],3)
        self.assertEqual(st['rewards'],[1]); self.assertEqual(st['courses']['sprout-3']['rewards'],[])
        self.assertEqual(st['courses']['sprout-3']['positions']['1'],0)
        backups=list(self.path.parent.glob('progress.db.pre-migration-*'))
        self.assertEqual(len(backups),1)
        with sqlite3.connect(backups[0]) as before: self.assertEqual('\n'.join(before.iterdump()),original_dump)
        with s.connect() as db:
            rows=db.execute('SELECT id,payload,created,time_basis,course_version FROM events').fetchall()
        self.assertEqual(len(rows),19)
        self.assertTrue(all(r[2]==1709164740 and r[3]=='legacy_saved' and r[4]=='sprout-2' for r in rows))
        self.assertEqual(Store(self.path).state(),st)
        self.assertEqual(len(list(self.path.parent.glob('progress.db.pre-migration-*'))),1)
        self.assertEqual(st['mastery']['confirmed'],0)
    def test_old_pending_payload_is_foundation_and_not_new_lesson(self):
        legacy_database(self.path)
        s=Store(self.path); old=dict(id='old-queue-event',day=1,step=1,answer=None)
        s.submit(old); s.submit(old)
        s.submit(event(s))
        self.assertEqual(s.state()['positions']['1'],2)
        self.assertEqual(s.state()['courses']['sprout-3']['positions']['1'],1)
    def test_unknown_or_corrupt_legacy_is_not_changed(self):
        legacy_database(self.path)
        with sqlite3.connect(self.path) as db: db.execute("UPDATE meta SET value='unknown' WHERE key='version'")
        before=self.path.read_bytes()
        with self.assertRaises(ValueError): Store(self.path)
        self.assertEqual(self.path.read_bytes(),before)
    def test_migration_failure_keeps_original(self):
        legacy_database(self.path)
        with sqlite3.connect(self.path) as db: db.execute('UPDATE events SET step=8')
        before=self.path.read_bytes()
        with self.assertRaises(ValueError): Store(self.path)
        self.assertEqual(self.path.read_bytes(),before)
    def test_missing_main_with_orphan_journal_does_not_initialize_over_recovery_data(self):
        sidecar=Path(str(self.path)+'-wal');sidecar.write_bytes(b'unresolved recovery bytes')
        with self.assertRaises(ValueError):Store(self.path)
        self.assertFalse(self.path.exists());self.assertEqual(sidecar.read_bytes(),b'unresolved recovery bytes')
