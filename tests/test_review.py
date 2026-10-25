import unittest
from course import lesson,DAYS
class Review(unittest.TestCase):
 def test_previous_day_all_five_reappear(self):
  for d in range(2,8):
   review=[x for x in lesson(d) if x['kind']=='review']
   self.assertEqual({x['char'] for x in review},{x['char'] for x in DAYS[d-2]['words']})
   self.assertTrue(all(x['answer'] in x['options'] and len(set(x['options']))==3 for x in review))
