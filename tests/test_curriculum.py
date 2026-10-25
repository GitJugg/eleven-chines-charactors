import copy
import unittest
from curriculum import catalog, get_course, tasks_for, validate_catalog

class Curriculum(unittest.TestCase):
    def test_real_content_and_planning_capacity_are_distinct(self):
        c = catalog()
        self.assertEqual(c['published_characters'], 70)
        self.assertEqual(c['planned_capacity'], 3000)
        self.assertEqual([s['target'] for s in c['stages']], [300,800,1500,2200,3000])
        old = get_course('sprout-2'); new = get_course('sprout-3')
        a = {w['char'] for d in old['days'] for w in d['words']}
        b = {w['char'] for d in new['days'] for w in d['words']}
        self.assertEqual(len(a),35); self.assertEqual(len(b),35); self.assertFalse(a & b)
        self.assertEqual(''.join(w['char'] for d in new['days'] for w in d['words']), '兔门出来在鸟树看见了河鱼游去里果吃你我也伞拿走回家晴开朋友们书找读这本')
        self.assertEqual(len(new['days']),7)
        self.assertTrue(all(s['status']=='planned' for s in c['stages'][1:]))
    def test_lessons_have_comprehension_guidance_and_unambiguous_matches(self):
        for day in range(1,8):
            tasks=tasks_for('sprout-3',day)
            self.assertTrue(any(t['kind']=='comprehension' for t in tasks))
            self.assertTrue(any(t['kind']=='sentence' and t['reading_mode']=='shared' for t in tasks))
            self.assertTrue(all(t.get('adult_prompt') for t in tasks))
            for task in tasks:
                if task.get('options'):
                    self.assertEqual(len(set(task['options'])),len(task['options']))
                    self.assertEqual(task['options'].count(task['answer']),1)
                if task['kind']=='match':
                    self.assertEqual([o for o in task['options'] if task['char'] in o], [task['answer']])
        self.assertTrue(any('换' in t.get('text','') for t in tasks_for('sprout-3',4)))
    def test_validation_can_accept_3000_synthetic_unique_characters_not_published_content(self):
        # Deliberately artificial fixture, not an educational word list.
        c=copy.deepcopy(get_course('sprout-3'))
        c['days']=[]
        for n in range(600):
            c['days'].append(dict(day=n+1,id=f'fixture-{n}',words=[dict(char=chr(0x4e00+n*5+j)) for j in range(5)]))
        validate_catalog([c])
        c['days'][-1]['words'][-1]['char']=c['days'][0]['words'][0]['char']
        with self.assertRaises(ValueError): validate_catalog([c])
    def test_invalid_course_and_day_rejected(self):
        for v,d in [('unknown',1),('sprout-3',True),('sprout-3',8)]:
            with self.assertRaises(ValueError): tasks_for(v,d)
