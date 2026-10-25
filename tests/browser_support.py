"""Real local browser/server harness. Every record and artifact is synthetic."""
import os
from pathlib import Path
import tempfile
import threading
from urllib.parse import urlsplit

try:
    from playwright.sync_api import sync_playwright, expect
except ImportError:
    sync_playwright = expect = None

from server import make_server

ROOT = Path(__file__).resolve().parents[1]
VIEWPORTS = {
    'pc': {'width': 1280, 'height': 800},
    'landscape': {'width': 1024, 'height': 768},
    'portrait': {'width': 768, 'height': 1024},
}


class BrowserHarness:
    """Mixin, not a TestCase: avoids discovering a second copy of the tests."""

    def setUp(self):
        self.assertIsNotNone(sync_playwright, 'Install requirements-test.txt; browser acceptance cannot skip.')
        executable = os.environ.get('BROWSER_EXECUTABLE')
        # Fail before starting any subprocess if the explicit executable is absent.
        if executable:
            self.assertTrue(Path(executable).is_file(), 'BROWSER_EXECUTABLE does not exist; acceptance failed.')
        self.tmp = tempfile.TemporaryDirectory(prefix='sprout-browser-synthetic-')
        self.addCleanup(self.tmp.cleanup)
        self.server = make_server('127.0.0.1', 0, Path(self.tmp.name) / 'progress.sqlite3')
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.addCleanup(self.stop_server)
        self.url = f'http://127.0.0.1:{self.server.server_port}'
        self.pw = sync_playwright().start()
        self.addCleanup(self.pw.stop)
        if not executable:
            self.assertTrue(Path(self.pw.chromium.executable_path).is_file(),
                            'Managed Chromium absent: run python -m playwright install chromium.')
        self.browser = self.pw.chromium.launch(headless=True, executable_path=executable, timeout=20000)
        self.addCleanup(self.browser.close)
        name = self._testMethodName.split('_')[1]
        self.context = self.browser.new_context(viewport=VIEWPORTS[name], has_touch=name != 'pc',
                                               locale='zh-CN', timezone_id='Asia/Shanghai')
        self.addCleanup(self.context.close)
        self.context.set_default_timeout(7000)
        self.context.set_default_navigation_timeout(10000)
        self.artifacts = ROOT / 'evidence' / 'browser' / self._testMethodName
        self.artifacts.mkdir(parents=True, exist_ok=True)
        self.context.tracing.start(screenshots=False, snapshots=True, sources=False)
        self.page = self.context.new_page()
        self.page_errors, self.wav_requests, self.external_requests = [], [], []
        self.page.on('pageerror', lambda error: self.page_errors.append(str(error)))
        self.page.on('request', self.record_request)
        self.context.route('**/*', self.local_only)
        self.addCleanup(self.finish_artifacts)

    def stop_server(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=5)
        self.assertFalse(self.thread.is_alive(), 'Local test server failed to stop')

    def record_request(self, request):
        if urlsplit(request.url).path.lower().endswith('.wav'):
            self.wav_requests.append(request.url)

    def local_only(self, route):
        parts = urlsplit(route.request.url)
        if parts.scheme in ('data', 'blob') or route.request.url.startswith(self.url + '/'):
            route.continue_()
        else:
            self.external_requests.append(route.request.url)
            route.abort()

    def finish_artifacts(self):
        # Always retain the final real page (including failures) and a compact trace.
        try:
            if not self.page.is_closed():
                self.page.screenshot(path=str(self.artifacts / 'final.png'), full_page=True, timeout=5000)
        finally:
            self.context.tracing.stop(path=str(self.artifacts / 'trace.zip'))
        self.assertEqual(self.page_errors, [], 'Uncaught browser JavaScript errors')
        self.assertEqual(self.external_requests, [], 'Unexpected non-local browser request')
        self.assertEqual(self.wav_requests, [], 'Adult/silent practice must not fetch WAV files')

    def assert_no_horizontal_overflow(self, name):
        # Check both root/body widths at the current real browser viewport.
        self.assertTrue(self.page.evaluate('''() => {
            const w = innerWidth;
            return document.documentElement.scrollWidth <= w && document.body.scrollWidth <= w;
        }'''), f'Horizontal overflow at {name}')

    def assert_visible_art(self, locator):
        # Presence/alt alone is insufficient: hidden or collapsed teaching art must fail.
        # Scrolling allows a legitimately tall lesson page; first-screen placement is not required.
        expect(locator).to_be_visible()
        locator.scroll_into_view_if_needed()
        box = locator.bounding_box()
        self.assertIsNotNone(box, 'Teaching SVG has no visible bounding box')
        self.assertGreaterEqual(box['width'], 48, 'Teaching SVG is too narrow to be legible')
        self.assertGreaterEqual(box['height'], 32, 'Teaching SVG is too short to be legible')

    def checkpoint(self, name):
        # Native pixels, never generated screenshots.
        self.assert_no_horizontal_overflow(name)
        self.page.screenshot(path=str(self.artifacts / (name + '.png')), full_page=True)

    def open_home(self):
        self.page.goto(self.url)
        expect(self.page.get_by_role('heading', name='今天，也长大一点点。')).to_be_visible()
        expect(self.page.get_by_role('button', name='开始今天的冒险', exact=True)).to_be_enabled()

    def open_parent(self):
        self.page.get_by_role('button', name='家长小窗', exact=True).click()
        self.page.get_by_label('3 + 4 等于几？', exact=True).fill('7')
        self.page.get_by_role('button', name='进入家长小窗', exact=True).click()
        expect(self.page.get_by_role('heading', name='看见每一点成长')).to_be_visible()
        expect(self.page.locator('#calendar-status')).to_contain_text('已读取')
