import unittest,tempfile,concurrent.futures,uuid
from pathlib import Path
from store import Store
class Concurrent(unittest.TestCase):
 def test_same_event_parallel_is_one_step(self):
  with tempfile.TemporaryDirectory() as tmp:
   s=Store(Path(tmp)/'db');event=dict(id=str(uuid.uuid4()),day=1,step=0,answer=None)
   with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    results=list(pool.map(lambda _:s.submit(event),range(16)))
   self.assertEqual(s.state()['positions']['1'],1)
   self.assertTrue(all(r['positions']['1']==1 for r in results))
 def test_different_events_at_same_step_only_one_wins(self):
  with tempfile.TemporaryDirectory() as tmp:
   s=Store(Path(tmp)/'db')
   def submit(_):
    try:s.submit(dict(id=str(uuid.uuid4()),day=1,step=0,answer=None));return True
    except ValueError:return False
   with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:results=list(pool.map(submit,range(16)))
   self.assertEqual(sum(results),1);self.assertEqual(s.state()['positions']['1'],1)
