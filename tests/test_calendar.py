import unittest,tempfile,datetime
from pathlib import Path
from store import Store
class Calendar(unittest.TestCase):
 def test_local_date_and_week_across_utc_boundary(self):
  with tempfile.TemporaryDirectory() as tmp:
   s=Store(Path(tmp)/'db')
   s.submit(dict(id='timezone-event',day=1,step=0,answer=None))
   stamp=datetime.datetime(2026,10,25,16,30,tzinfo=datetime.timezone.utc).timestamp()
   with s.connect() as db: db.execute('UPDATE events SET created=?',(stamp,))
   state=s.state(now=stamp,timezone='Asia/Shanghai')
   self.assertEqual(state['calendar']['date'],'2026-10-26')
   self.assertEqual(state['calendar']['week_start'],'2026-10-26')
   self.assertEqual(state['calendar']['today_steps'],1)
   self.assertEqual(state['calendar']['week_steps'],1)
   before=s.state(now=stamp-3600,timezone='Asia/Shanghai')
   self.assertEqual(before['calendar']['today_steps'],0)
