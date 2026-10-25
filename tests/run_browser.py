"""Dedicated browser acceptance entrypoint; no silent skips or empty discovery."""
import os
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]


def run_suite(suite, stream=None):
    result = unittest.TextTestRunner(stream=stream, verbosity=2).run(suite)
    accepted = result.wasSuccessful() and result.testsRun > 0 and not result.skipped
    if not accepted:
        print('Browser acceptance FAILED: failures, errors, skips, or zero tests.',
              file=stream or sys.stderr)
    return 0 if accepted else 1


def main():
    # Set before discovery, so test decorators cannot silently disable this job.
    os.environ['RUN_BROWSER'] = '1'
    sys.path.insert(0, str(ROOT))
    suite = unittest.defaultTestLoader.discover(str(ROOT / 'tests'), pattern='test_browser.py')
    return run_suite(suite)


if __name__ == '__main__':
    sys.exit(main())
