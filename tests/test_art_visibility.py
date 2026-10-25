"""Unit checks for browser assertion control flow; NOT real browser acceptance."""
import unittest
from unittest.mock import Mock, patch

from browser_support import BrowserHarness


class ArtVisibilityGuard(unittest.TestCase):
    def locator(self, box=None):
        locator = Mock()
        locator.bounding_box.return_value = box or {'x': 10, 'y': 20, 'width': 140, 'height': 92}
        return locator

    def test_hidden_art_cannot_pass_with_valid_attributes_and_size(self):
        locator = self.locator()
        with patch('browser_support.expect') as expect:
            expect.return_value.to_be_visible.side_effect = AssertionError('hidden SVG')
            with self.assertRaisesRegex(AssertionError, 'hidden SVG'):
                BrowserHarness.assert_visible_art(self, locator)

    def test_zero_missing_and_tiny_bounds_are_rejected(self):
        for box in (None, {'width': 0, 'height': 100}, {'width': 100, 'height': 0},
                    {'width': 2, 'height': 2}):
            with self.subTest(box=box), patch('browser_support.expect'):
                locator = self.locator()
                locator.bounding_box.return_value = box
                with self.assertRaises(AssertionError):
                    BrowserHarness.assert_visible_art(self, locator)

    def test_legible_art_is_scrolled_into_view_not_required_to_start_on_screen(self):
        locator = self.locator({'x': 10, 'y': 2400, 'width': 140, 'height': 92})
        with patch('browser_support.expect') as expect:
            BrowserHarness.assert_visible_art(self, locator)
            expect.return_value.to_be_visible.assert_called_once_with()
        locator.scroll_into_view_if_needed.assert_called_once_with()
        locator.bounding_box.assert_called_once_with()
