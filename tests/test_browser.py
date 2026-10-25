"""Cloud Chromium acceptance. Not Android hardware acceptance."""
import unittest,tempfile,threading,os
from pathlib import Path
try:
 from playwright.sync_api import sync_playwright
except ImportError:sync_playwright=None
try:
 from server import make_server
except ImportError: make_server=None
@unittest.skipUnless(os.environ.get("RUN_BROWSER")=="1", "Browser acceptance requires RUN_BROWSER=1 and an environment allowing Chromium sockets")
class Browser(unittest.TestCase):
 def setUp(self):
  self.assertIsNotNone(make_server,'HTTP app not implemented')
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
  self.server=make_server('127.0.0.1',0,Path(self.tmp.name)/'progress.db')
  self.thread=threading.Thread(target=self.server.serve_forever,daemon=True);self.thread.start()
  self.addCleanup(self.stop_server)
  self.p=sync_playwright().start();self.addCleanup(self.p.stop); self.browser=self.p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  self.page=self.browser.new_page(viewport={'width':1024,'height':768},has_touch=True)
  self.addCleanup(self.browser.close)
  self.url='http://127.0.0.1:'+str(self.server.server_port)
 def stop_server(self):
  self.server.shutdown();self.server.server_close();self.thread.join()
 def test_home_pause_refresh_and_parent(self):
  p=self.page;p.goto(self.url);p.get_by_role('button',name='开始今天的冒险').click()
  p.get_by_role('button',name='先休息一下').click()
  p.reload();p.get_by_role('button',name='开始今天的冒险').click()
  self.assertIn('一起去小院找汉字',p.locator('main').inner_text())
  p.get_by_role('button',name='先休息一下').click()
  p.get_by_role('button',name='家长小窗').click();p.get_by_label('3 + 4 等于几？').fill('7')
  p.get_by_role('button',name='进入家长小窗').click()
  p.get_by_text('完成不等于掌握',exact=False).wait_for()
  self.assertEqual(p.locator('.word-status').count(),35)
 def test_portrait_no_overflow(self):
  p=self.page;p.set_viewport_size({'width':600,'height':960});p.goto(self.url)
  p.get_by_role('button',name='开始今天的冒险').wait_for()
  self.assertTrue(p.evaluate('document.documentElement.scrollWidth <= innerWidth'))
