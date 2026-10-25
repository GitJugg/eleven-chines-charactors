import unittest,tempfile,json,hashlib,wave
from pathlib import Path
try:
 from scripts.audio import validate_cached
except (ImportError,FileNotFoundError):validate_cached=None
class Audio(unittest.TestCase):
 def test_changed_text_never_silently_keeps_old_audio(self):
  self.assertIsNotNone(validate_cached,'safe cached-audio validation missing')
  with tempfile.TemporaryDirectory() as tmp:
   p=Path(tmp)/'clip.wav'
   with wave.open(str(p),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(22050);w.writeframes(b'\0\0'*22050)
   old={'clip':{'text':'old','sha256':hashlib.sha256(p.read_bytes()).hexdigest()}}
   self.assertFalse(validate_cached(p,'clip','new',old))
   self.assertTrue(validate_cached(p,'clip','old',old))
   p.write_bytes(b'bad');self.assertFalse(validate_cached(p,'clip','old',old))
