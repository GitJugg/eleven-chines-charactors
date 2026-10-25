import unittest,tempfile,uuid
from pathlib import Path
try:
 from store import Store
 from course import DAYS, lesson
except ImportError:
 Store=None
class Core(unittest.TestCase):
 def setUp(self):
  self.assertIsNotNone(Store,'persistence core not implemented')
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
  self.path=Path(self.tmp.name)/'learn.db';self.s=Store(self.path)
 def event(self,day,step,answer=None):
  return dict(id=str(uuid.uuid4()),day=day,step=step,answer=answer)
 def complete(self,day):
  for i,t in enumerate(lesson(day)):
   self.s.submit(self.event(day,i,t.get('answer')))
 def test_day_one_restart_and_idempotent(self):
  e=self.event(1,0);self.s.submit(e);self.s.submit(e)
  self.assertEqual(Store(self.path).state()['positions']['1'],1)
  self.assertEqual(len(self.s.state()['rewards']),0)
 def test_reject_skip_and_changed_duplicate(self):
  with self.assertRaises(ValueError):self.s.submit(self.event(1,2))
  e=self.event(1,0);self.s.submit(e);e['step']=1
  with self.assertRaises(ValueError):self.s.submit(e)
 def test_seven_days_rewards_and_familiarity(self):
  self.assertEqual(len(DAYS),7)
  self.assertEqual(len({w['char'] for d in DAYS for w in d['words']}),35)
  for day in range(1,8):self.complete(day)
  st=self.s.state();self.assertEqual(len(st['rewards']),7)
  self.assertEqual(len(st['stats']),35)
  self.assertTrue(all(x['correct']>=2 for x in st['stats'].values()))
 def test_wrong_answer_counts_but_not_mastery(self):
  for i,t in enumerate(lesson(1)):
   self.s.submit(self.event(1,i,t['options'][-1] if t.get('options') else None))
  self.assertEqual(len(self.s.state()['rewards']),1)
  self.assertGreater(sum(x['wrong'] for x in self.s.state()['stats'].values()),0)
 def test_backup_roundtrip(self):
  self.complete(1);dest=Path(self.tmp.name)/'backup.db';self.s.backup(dest)
  self.assertEqual(Store(dest).state(),self.s.state())
if __name__=='__main__':unittest.main()
