import unittest, tempfile, threading, urllib.request, urllib.error, json
from pathlib import Path
try:
 from server import make_server
except ImportError:
 make_server=None

class HTTP(unittest.TestCase):
 def setUp(self):
  self.assertIsNotNone(make_server, 'HTTP server not implemented')
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
  self.server=make_server('127.0.0.1',0,Path(self.tmp.name)/'progress.db')
  self.thread=threading.Thread(target=self.server.serve_forever,daemon=True);self.thread.start()
  self.addCleanup(self.stop)
  self.url='http://127.0.0.1:'+str(self.server.server_port)
 def stop(self):
  self.server.shutdown();self.server.server_close();self.thread.join()
 def req(self,path,body=None,headers=None):
  h={'Content-Type':'application/json'};h.update(headers or {})
  data=None if body is None else json.dumps(body).encode()
  try:r=urllib.request.urlopen(urllib.request.Request(self.url+path,data=data,headers=h))
  except urllib.error.HTTPError as e:r=e
  return r.status,r.read(),r.headers
 def test_course_and_persisted_event(self):
  code,body,_=self.req('/api/course');self.assertEqual(code,200)
  self.assertEqual(len(json.loads(body)['days']),7)
  e=dict(id='event-test-000',day=1,step=0,answer=None)
  for _ in range(2):
   code,body,_=self.req('/api/event',e);self.assertEqual(code,200)
   self.assertEqual(json.loads(body)['positions']['1'],1)
  code,body,_=self.req('/api/state');self.assertEqual(json.loads(body)['positions']['1'],1)
 def test_invalid_payloads_and_cross_origin(self):
  for payload in [[],None,{'id':1},{'id':'x'*10,'day':True,'step':0,'answer':None}]:
   if payload is None:payload='bad'
   self.assertEqual(self.req('/api/event',payload)[0],400)
  self.assertEqual(self.req('/api/event',{}, {'Origin':'https://evil.example'})[0],403)
  self.assertEqual(self.req('/api/event',{}, {'Content-Type':'text/plain'})[0],415)
 def test_no_private_or_traversal_files(self):
  for path in ['/store.py','/../store.py','/%2e%2e/store.py','/data/progress.db','/static/../store.py']:
   self.assertEqual(self.req(path)[0],404,path)
 def test_backup_is_sqlite(self):
  code,body,h=self.req('/api/backup');self.assertEqual(code,200)
  self.assertTrue(body.startswith(b'SQLite format 3\x00'))
  self.assertIn('attachment',h['Content-Disposition'])
 def test_static_app(self):
  for path in ['/','/app.js','/style.css','/audio/welcome.wav']:
   self.assertEqual(self.req(path)[0],200,path)
