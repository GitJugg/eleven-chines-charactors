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
  self.assertEqual(Store(target).state(),a.state())
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
