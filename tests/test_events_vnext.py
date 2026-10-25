import tempfile, unittest
from pathlib import Path
from store import Store
from curriculum import tasks_for
from helpers import event

class EventsVNext(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.s=Store(Path(self.tmp.name)/'db')
    def test_course_run_scope_and_idempotent_content(self):
        s=self.s; e=event(s);s.submit(e);s.submit(e)
        altered=dict(e,mode='silent')
        with self.assertRaises(ValueError): s.submit(altered)
        with self.assertRaises(ValueError): s.submit(event(s,step=2))
        self.assertEqual(s.state()['courses']['sprout-3']['positions']['1'],1)
        self.assertEqual(s.state()['positions']['1'],0)
        self.assertEqual(s.state()['mastery']['confirmed'],0)
    def test_repeat_foundation_preserves_first_reward(self):
        s=self.s
        for i,t in enumerate(tasks_for('sprout-2',1)): s.submit(event(s,step=i,version='sprout-2'))
        for run in ['review-one','review-two']:
            for i,t in enumerate(tasks_for('sprout-2',1)): s.submit(event(s,step=i,version='sprout-2',run=run))
        st=s.state();self.assertEqual(st['rewards'],[1]);self.assertEqual(len(st['runs']),3)
        self.assertEqual(st['positions']['1'],19)
        self.assertEqual(st['mastery']['confirmed'],0)
        self.assertEqual(st['runs'][-1]['position'],19)
    def test_reject_unearned_review_or_cross_course_lesson_and_stale_generation(self):
        for changes in [dict(run_id='review-new'),dict(lesson_id='foundation-01'),dict(generation='stale')]:
            with self.assertRaises(ValueError): self.s.submit(dict(event(self.s),**changes))
    def test_settings_are_validated_and_not_inferred_from_completions(self):
        s=self.s;self.assertEqual(s.settings()['daily_new_target'],5)
        self.assertEqual(s.settings()['reference_minutes'],20)
        self.assertIsNone(s.settings()['target_date'])
        s.settings(dict(target_characters=3000,target_date='2030-08-31',daily_new_target=5,reference_minutes=20))
        self.assertEqual(s.settings()['target_date'],'2030-08-31')
        for values in [dict(target_date='2030-02-30'),dict(daily_new_target=True),dict(target_characters=0),dict(name='private')]:
            with self.assertRaises(ValueError): s.settings(values)
