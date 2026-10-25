import tempfile,unittest,sqlite3
from pathlib import Path
from store import Store
try:
 from scripts.restore import restore
except ImportError:restore=None
class Restore(unittest.TestCase):
 def setUp(self):
  self.assertIsNotNone(restore,'restore tool not implemented')
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name)
 def test_restore_preserves_current_and_restores_source(self):
  source=self.root/'source.db';target=self.root/'target.db';a=Store(source);b=Store(target)
  a.submit(dict(id='restore-event',day=1,step=0,answer=None))
  previous=restore(source,target,confirm='RESTORE')
  self.assertTrue(previous.is_file());self.assertEqual(Store(previous).state()['positions']['1'],0)
  restored=Store(target).state();original=a.state()
  self.assertNotEqual(restored.pop('generation'),original.pop('generation'));self.assertEqual(restored,original)
 def test_invalid_backup_does_not_change_target(self):
  source=self.root/'bad.db';target=self.root/'target.db';Store(target);before=target.read_bytes();source.write_text('not a database')
  with self.assertRaises(ValueError):restore(source,target,confirm='RESTORE')
  self.assertEqual(target.read_bytes(),before)
 def test_confirmation_and_same_path_required(self):
  source=self.root/'source.db';Store(source)
  with self.assertRaises(ValueError):restore(source,self.root/'target.db',confirm='yes')
  with self.assertRaises(ValueError):restore(source,source,confirm='RESTORE')
 def test_tampered_event_rejected(self):
  source=self.root/'source.db';s=Store(source);s.submit(dict(id='restore-event',day=1,step=0,answer=None))
  with s.connect() as db:db.execute('UPDATE events SET step=9')
  with self.assertRaises(ValueError):restore(source,self.root/'target.db',confirm='RESTORE')
 def test_running_service_blocks_restore(self):
  from server import make_server
  source=self.root/'source.db';target=self.root/'target.db';Store(source)
  server=make_server('127.0.0.1',0,target)
  try:
   with self.assertRaises(RuntimeError):restore(source,target,confirm='RESTORE')
  finally:server.server_close()
 def test_more_than_1000_events_restore_without_loss_and_reject_old_generation(self):
  from helpers import event
  from curriculum import tasks_for
  from store import validate_database
  source=self.root/'large.db';target=self.root/'restored.db';s=Store(source)
  for run in ['main']+[f'review-{n}' for n in range(53)]:
   for step,t in enumerate(tasks_for('sprout-2',1)):s.submit(event(s,step,version='sprout-2',run=run))
  with s.connect() as db:self.assertEqual(db.execute('SELECT COUNT(*) FROM events').fetchone()[0],1026)
  before=s.calendar('2024-02');restore(source,target,confirm='RESTORE');restored=Store(target)
  after=restored.calendar('2024-02');before.pop('updated_at');after.pop('updated_at');self.assertEqual(after,before)
  validate_database(target)
  stale=event(s,version='sprout-3')
  with self.assertRaises(ValueError):restored.submit(stale)
  with self.assertRaises(ValueError):restored.submit(dict(id='old-after-restore',day=2,step=0,answer='日'))
 def test_restore_legacy_migrates_copy_not_source(self):
  from helpers import legacy_database
  source=self.root/'legacy.db';target=self.root/'new.db';legacy_database(source);before=source.read_bytes()
  restore(source,target,confirm='RESTORE')
  self.assertEqual(source.read_bytes(),before);self.assertEqual(Store(target).state()['positions']['1'],1)
 def test_tampered_time_and_unknown_schema_leave_target_intact(self):
  from helpers import event
  for column,value in [('activity_date','2099-01-01'),('mode','independent')]:
   source=self.root/f'{column}.db';target=self.root/f'target-{column}.db';s=Store(source);s.submit(event(s));Store(target);before=target.read_bytes()
   with s.connect() as db:db.execute(f'UPDATE events SET {column}=?',(value,))
   with self.assertRaises(ValueError):restore(source,target,confirm='RESTORE')
   self.assertEqual(target.read_bytes(),before)
 def test_orphan_sidecars_refuse_restore_even_when_target_main_is_missing(self):
  source=self.root/'source.db';Store(source)
  for suffix in ['-wal','-shm','-journal']:
   target=self.root/('missing'+suffix+'.db');sidecar=Path(str(target)+suffix);sidecar.write_bytes(b'unknown database recovery data')
   with self.assertRaises(ValueError):restore(source,target,confirm='RESTORE')
   self.assertFalse(target.exists());self.assertEqual(sidecar.read_bytes(),b'unknown database recovery data')
 def test_legacy_restore_uses_target_timezone_or_configured_timezone(self):
  from helpers import legacy_database
  from unittest.mock import patch
  source=self.root/'legacy-zone.db';legacy_database(source)
  target=self.root/'target-zone.db';Store(target,timezone='America/New_York')
  restore(source,target,confirm='RESTORE')
  restored=Store(target);self.assertEqual(restored.timezone,'America/New_York')
  self.assertEqual(restored.calendar('2024-02')['days'][27]['steps'],1)
  new=self.root/'new-zone.db'
  with patch.dict('os.environ',{'APP_TIMEZONE':'America/New_York'}):restore(source,new,confirm='RESTORE')
  self.assertEqual(Store(new).timezone,'America/New_York')
 def test_incomplete_settings_backup_is_rejected_without_replacing_target(self):
  source=self.root/'settings.db';s=Store(source);target=self.root/'settings-target.db';Store(target);before=target.read_bytes()
  with s.connect() as db:db.execute("UPDATE meta SET value='{}' WHERE key='settings'")
  with self.assertRaises(ValueError):restore(source,target,confirm='RESTORE')
  self.assertEqual(target.read_bytes(),before)
 def test_valid_current_backup_ignores_untrusted_target_timezone(self):
  from helpers import event
  source=self.root/'valid-source.db';s=Store(source,timezone='UTC');s.submit(event(s))
  target=self.root/'damaged-target.db';t=Store(target)
  with t.connect() as db:db.execute("UPDATE meta SET value='corrupt/not-a-zone' WHERE key='activity_timezone'")
  restore(source,target,confirm='RESTORE')
  recovered=Store(target);self.assertEqual(recovered.timezone,'UTC');self.assertEqual(recovered.state()['courses']['sprout-3']['positions']['1'],1)
