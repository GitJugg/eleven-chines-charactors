"""The acceptance command must never report success for skips or no tests."""
import io
import unittest

from run_browser import run_suite


class BrowserGate(unittest.TestCase):
    def result_for(self, body):
        class Example(unittest.TestCase):
            def runTest(self):
                body(self)
        return run_suite(unittest.TestSuite([Example()]), stream=io.StringIO())

    def test_real_pass_is_success(self):
        self.assertEqual(self.result_for(lambda test: test.assertTrue(True)), 0)

    def test_skipped_browser_is_failure(self):
        self.assertEqual(self.result_for(lambda test: test.skipTest('browser unavailable')), 1)

    def test_empty_discovery_is_failure(self):
        self.assertEqual(run_suite(unittest.TestSuite(), stream=io.StringIO()), 1)

    def test_assertion_failure_is_failure(self):
        self.assertEqual(self.result_for(lambda test: test.fail('wrong UI')), 1)

    def test_launch_error_is_failure(self):
        def unavailable(_):
            raise RuntimeError('Chromium cannot launch')
        self.assertEqual(self.result_for(unavailable), 1)
