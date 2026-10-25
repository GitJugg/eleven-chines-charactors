import datetime, tempfile, unittest
from pathlib import Path
from unittest.mock import patch
from store import Store
from curriculum import tasks_for
from helpers import event

def stamp(text): return datetime.datetime.fromisoformat(text).timestamp()

class Calendar(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.s=Store(Path(self.tmp.name)/'db')
    def day(self,month,day,**kwargs):
        return next(d for d in self.s.calendar(month,**kwargs)['days'] if d['date']==day)
    def test_local_midnight_late_sync_and_duplicate_are_actual_dates(self):
        with patch('store.time.time',return_value=stamp('2024-03-01T01:00:00+00:00')):
            e=event(self.s,stamp='2024-02-29T15:59:00+00:00');self.s.submit(e);self.s.submit(e)
            self.s.submit(event(self.s,1,stamp='2024-02-29T16:01:00+00:00'))
        self.assertEqual(self.day('2024-02','2024-02-29')['steps'],1)
        march=self.day('2024-03','2024-03-01')
        self.assertEqual(march['steps'],1);self.assertEqual(march['new_characters'],['兔'])
        self.assertEqual(march['sources'],['client_reported'])
        self.assertEqual(len(self.s.calendar('2024-02')['days']),29)
        self.assertEqual(self.s.calendar('2024-02')['leading_empty'],3)
    def test_fixed_timezone_survives_restart_and_config_drift(self):
        self.s.submit(event(self.s,stamp='2024-01-01T23:59:00+00:00'))
        other=Store(self.s.path,timezone='America/New_York')
        self.assertEqual(other.calendar('2024-01')['timezone'],'Asia/Shanghai')
        self.assertEqual(other.calendar('2024-01',timezone='UTC')['days'][1]['steps'],1)
    def test_dst_timezone_and_year_boundary(self):
        s=Store(Path(self.tmp.name)/'newyork',timezone='America/New_York')
        s.submit(event(s,stamp='2024-03-10T06:59:00+00:00'))
        s.submit(event(s,1,stamp='2024-03-10T07:01:00+00:00'))
        self.assertEqual(s.calendar('2024-03')['days'][9]['steps'],2)
        s.submit(event(s,2,stamp='2025-01-01T04:59:00+00:00'))
        s.submit(event(s,3,stamp='2025-01-01T05:01:00+00:00'))
        self.assertEqual(s.calendar('2024-12')['days'][30]['steps'],1)
        self.assertEqual(s.calendar('2025-01')['days'][0]['steps'],1)
    def test_old_and_invalid_client_clock_use_saved_date_labeled(self):
        with patch('store.time.time',return_value=stamp('2024-03-01T01:00:00+00:00')):
            self.s.submit(dict(id='legacy-late-queue',day=1,step=0,answer=None))
            self.s.submit(event(self.s,stamp='2099-01-01T00:00:00+00:00'))
            self.s.submit(dict(event(self.s,1),client_timezone='not/a-zone'))
        today=self.day('2024-03','2024-03-01')
        self.assertEqual(today['steps'],3)
        self.assertEqual(set(today['sources']),{'legacy_saved','invalid_client_saved'})
        self.assertEqual(self.day('2099-01','2099-01-01')['steps'],0)
    def test_empty_partial_complete_and_repeat_counts(self):
        tasks=tasks_for('sprout-3',1)
        for i,t in enumerate(tasks):
            day='28' if i<4 else '29' if i<len(tasks)-1 else '01'
            month='03' if day=='01' else '02'
            self.s.submit(event(self.s,i,stamp=f'2024-{month}-{day}T02:00:00+00:00'))
        early=self.day('2024-02','2024-02-28');middle=self.day('2024-02','2024-02-29');end=self.day('2024-03','2024-03-01')
        self.assertEqual(early['completed'],[]);self.assertEqual(middle['completed'],[]);self.assertEqual(len(end['completed']),1)
        self.assertEqual(early['new_characters'],['兔','门','出'])
        self.assertEqual(middle['new_characters'],['来','在'])
        self.assertEqual(middle['review_characters'],[])
        self.assertEqual(middle['other_questions'],11)
        self.assertEqual(self.day('2024-03','2024-03-02')['steps'],0)
        for i,t in enumerate(tasks):self.s.submit(event(self.s,i,run='repeat-001',stamp='2024-03-01T03:00:00+00:00'))
        end=self.day('2024-03','2024-03-01')
        self.assertEqual(end['new_characters'],[]);self.assertEqual(len(end['review_characters']),5)
        self.assertEqual(end['review_questions'],10);self.assertEqual(end['review_correct'],10)
        self.assertEqual(len(end['contacted_characters']),5);self.assertEqual(len(end['completed']),2)
        self.assertEqual(self.day('2024-03','2024-03-01',course_version='sprout-2')['steps'],0)
    def test_invalid_calendar_queries(self):
        for month in ['2024-13','2024-00','2024-2','garbage','0000-01','9999-12']:
            with self.assertRaises(ValueError):self.s.calendar(month)
        with self.assertRaises(ValueError):self.s.calendar('2024-02',course_version='unknown')
    def test_near_future_client_clock_cannot_create_tomorrow_activity(self):
        with patch('store.time.time',return_value=stamp('2024-02-29T15:59:30+00:00')):
            self.s.submit(event(self.s,stamp='2024-02-29T16:01:00+00:00'))
        self.assertEqual(self.day('2024-03','2024-03-01')['steps'],0)
        today=self.day('2024-02','2024-02-29')
        self.assertEqual(today['steps'],1);self.assertEqual(today['sources'],['invalid_client_saved'])
