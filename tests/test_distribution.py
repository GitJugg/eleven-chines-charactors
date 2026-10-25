"""Exercise imports from the Docker COPY source set; not a Docker build test."""
import os,shutil,subprocess,sys,tempfile,unittest
from pathlib import Path

class Distribution(unittest.TestCase):
 def test_declared_runtime_copy_can_import_real_server(self):
  root=Path(__file__).resolve().parents[1]
  with tempfile.TemporaryDirectory() as tmp:
   dest=Path(tmp)
   for line in (root/'Dockerfile').read_text().splitlines():
    if not line.startswith('COPY '):continue
    *sources,target=line.split()[1:]
    for source in sources:
     src=root/source;out=dest/(src.name if target=='./' else target)
     if src.is_dir():shutil.copytree(src,out,dirs_exist_ok=True)
     else:shutil.copy2(src,out)
   result=subprocess.run([sys.executable,'-c','import server; from curriculum import catalog; assert catalog()["published_characters"]==70'],cwd=dest,env={k:v for k,v in os.environ.items() if k!='PYTHONPATH'},capture_output=True,text=True)
   self.assertEqual(result.returncode,0,result.stderr)
