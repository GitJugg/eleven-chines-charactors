"""Real Chromium acceptance with synthetic SQLite. NOT Android hardware acceptance.

Learning journeys use actual UI clicks for every step. Only calendar-specific tests
seed explicitly synthetic events through the local HTTP API (see tests/README.md).
"""
from datetime import date, timedelta
import os
import unittest

from browser_support import BrowserHarness, expect
from curriculum import tasks_for
from helpers import event


@unittest.skipUnless(os.environ.get('RUN_BROWSER') == '1',
                     'Opt-in browser tests; CI must invoke tests/run_browser.py (rejects every skip)')
class BrowserAcceptance(BrowserHarness, unittest.TestCase):
    def finish_lesson_through_ui(self, version, *, wrong_once=False, pause_resume=False,
                                 refresh_at_reward=False, prefix='lesson'):
        p = self.page
        tasks = tasks_for(version, 1)
        wrong_done = correct_checked = False
        for index, task in enumerate(tasks):
            progress = p.get_by_role('progressbar', name='本课进度')
            expect(progress).to_have_attribute('value', str(index))
            expect(p.get_by_role('heading', name=task['title'], exact=True)).to_be_visible()
            self.assert_no_horizontal_overflow(f'{prefix}-step-{index}')
            if version == 'sprout-3':
                expect(p.locator('#play')).to_have_count(0)
            if task.get('options'):
                for choice in task['options']:
                    # Foundation option SVGs contribute extra accessible names.
                    expect(p.locator(f'button[data-answer="{choice}"]')).to_be_disabled()
            else:
                expect(p.locator('#advance')).to_be_disabled()
            mode = '大人已带读 / 讲解' if index % 2 == 0 else '静音看字 / 对照练习'
            p.get_by_role('button', name=mode, exact=True).click()
            expect(p.locator('#adult-prompt')).to_be_hidden()
            expect(p.locator('#audio-note')).to_contain_text('不是自主认读' if index % 2 == 0 else '不计自主认读' if task['kind'] not in ('listen', 'review') else '不是听音检查')
            wrong = bool(task.get('options') and wrong_once and not wrong_done)
            if task.get('options'):
                answer = next(x for x in task['options'] if x != task['answer']) if wrong else task['answer']
                p.locator(f'button[data-answer="{answer}"]').click()
            else:
                p.get_by_role('button', name='收下今天的小花' if task['kind'] == 'reward' else '这一步练好了，继续', exact=True).click()
            next_name = '回到小花园' if task['kind'] == 'reward' else '下一小步'
            expect(p.get_by_role('button', name=next_name, exact=True)).to_be_visible()
            expect(progress).to_have_attribute('value', str(index))
            if task.get('options'):
                check_manual_wait = wrong or not correct_checked
                if wrong:
                    expect(p.locator('#feedback')).to_contain_text('这次还没找对，一起看看！')
                    expect(p.get_by_role('button', name=answer + '，还不是这个', exact=True)).to_be_disabled()
                    expect(p.get_by_role('button', name=task['answer'] + '，正确的朋友，看看这个', exact=True)).to_be_disabled()
                    wrong_done = True
                    self.checkpoint(prefix + '-wrong-feedback')
                else:
                    expect(p.locator('#feedback')).to_contain_text('答对啦，找到朋友了！')
                    expect(p.get_by_role('button', name=answer + '，答对了', exact=True)).to_be_disabled()
                    if not correct_checked:
                        self.checkpoint(prefix + '-correct-feedback')
                        correct_checked = True
                if check_manual_wait:
                    p.wait_for_timeout(350)  # Verify feedback does not automatically advance.
                    expect(progress).to_have_attribute('value', str(index))
            if index == 1:
                self.checkpoint(prefix + '-learning')
            if task['kind'] == 'reward':
                expect(p.locator('#feedback')).to_contain_text('今天的小花，已经种好啦！')
                self.checkpoint(prefix + '-reward')
                if refresh_at_reward:
                    p.reload()
                else:
                    p.get_by_role('button', name=next_name, exact=True).click()
                expect(p.get_by_role('heading', name='今天，也长大一点点。')).to_be_visible()
                expect(p.locator('.hero .eyebrow')).to_contain_text('第 2 课')
                return
            p.get_by_role('button', name=next_name, exact=True).click()
            expect(progress).to_have_attribute('value', str(index + 1))
            if index == 0 and pause_resume:
                p.get_by_role('button', name='先休息一下', exact=True).click()
                expect(p.get_by_role('button', name='接着上次的冒险', exact=True)).to_be_enabled()
                p.reload()
                p.get_by_role('button', name='接着上次的冒险', exact=True).click()
                expect(progress).to_have_attribute('value', '1')

    def learning_journey(self):
        p = self.page
        self.open_home()
        self.checkpoint('home')
        # Enter foundation through its visible course tab, then leave without a fake event.
        p.get_by_role('button', name='基础 35 字', exact=True).click()
        expect(p.get_by_role('heading', name='基础复习小花园')).to_be_visible()
        p.get_by_role('button', name='开始今天的冒险', exact=True).click()
        expect(p.get_by_role('heading', name='一起去小院找汉字')).to_be_visible()
        self.checkpoint('foundation-entry')
        p.get_by_role('button', name='先休息一下', exact=True).click()
        p.get_by_role('button', name='进阶 · 小兔的阅读之旅', exact=True).click()
        p.get_by_role('button', name='开始今天的冒险', exact=True).click()
        self.finish_lesson_through_ui('sprout-3', wrong_once=True, pause_resume=True,
                                     refresh_at_reward=True, prefix='progressive')
        # The reward was genuinely posted before reload; no fixture completes this lesson.
        self.assertEqual(self.server.store.state()['courses']['sprout-3']['rewards'], [1])
        self.checkpoint('after-completion-reload')
        p.get_by_role('button', name='开始今天的冒险', exact=True).click()
        expect(p.locator('.lesson-top .eyebrow')).to_contain_text('第 2 课')
        expect(p.get_by_role('progressbar', name='本课进度')).to_have_attribute('value', '0')
        p.get_by_role('button', name='先休息一下', exact=True).click()
        p.get_by_role('button', name='基础 35 字', exact=True).click()
        p.get_by_role('button', name='开始今天的冒险', exact=True).click()
        self.finish_lesson_through_ui('sprout-2', prefix='foundation')
        self.assertEqual(self.server.store.state()['courses']['sprout-2']['rewards'], [1])
        # The completed lesson card creates a distinct review run, via UI only.
        p.locator('#lesson-1').click()
        expect(p.locator('.lesson-top .eyebrow')).to_contain_text('复习第 1 课')
        self.finish_lesson_through_ui('sprout-2', prefix='foundation-repeat')
        p.reload()
        expect(p.locator('.hero .eyebrow')).to_contain_text('第 2 课')
        state = self.server.store.state()
        self.assertEqual(state['courses']['sprout-2']['rewards'], [1])
        self.assertEqual(state['mastery']['confirmed'], 0)
        runs = [r for r in state['runs'] if r['course_version'] == 'sprout-2']
        self.assertEqual(len(runs), 2)
        self.assertTrue(all(r['complete'] for r in runs))
        self.assertEqual(sum(r['run_id'] == 'main' for r in runs), 1)
        self.open_parent()
        expect(p.locator('.word-status')).to_have_count(35)
        today = state['calendar']['date']
        cell = p.locator('#date-' + today)
        cell.focus()
        cell.press('Enter')
        expect(cell).to_have_attribute('aria-pressed', 'true')
        expect(p.locator('#calendar-detail')).to_contain_text('小兔出门')
        expect(p.locator('#calendar-detail')).to_contain_text('阳光小院（复习）')
        expect(p.locator('#calendar-detail')).to_contain_text('成人带读 / 讲解')
        expect(p.locator('#calendar-detail')).to_contain_text('静音 / 对照练习')
        self.checkpoint('real-ui-learning-calendar')

    def calendar_fixture_journey(self):
        # Explicit API fixture: calendar-only historical records, never learning acceptance.
        # All dates are in previous months, avoiding clock-dependent future rejection.
        today = date.fromisoformat(self.server.store.state()['calendar']['date'])
        previous_last = today.replace(day=1) - timedelta(days=1)
        previous_first = previous_last.replace(day=1)
        earlier_last = previous_first - timedelta(days=1)
        earlier_day = earlier_last - timedelta(days=1)
        for index, _ in enumerate(tasks_for('sprout-3', 1)):
            day = earlier_day if index < 4 else earlier_last
            payload = event(self.server.store, index, stamp=day.isoformat() + 'T04:00:00+00:00',
                            mode='adult' if index % 2 == 0 else 'silent')
            response = self.context.request.post(self.url + '/api/event', data=payload)
            self.assertEqual(response.status, 200)
        for index, day in enumerate((earlier_last, previous_first)):
            payload = event(self.server.store, index, version='sprout-2',
                            stamp=day.isoformat() + 'T04:00:00+00:00')
            self.assertEqual(self.context.request.post(self.url + '/api/event', data=payload).status, 200)
        self.open_home()
        self.open_parent()
        p = self.page
        p.get_by_role('button', name='上个月', exact=True).click()
        expect(p.locator('#calendar-title')).to_have_text(previous_first.strftime('%Y-%m'))
        p.locator('#date-' + previous_first.isoformat()).click()
        expect(p.locator('#calendar-detail')).to_contain_text('1 学习小步')
        expect(p.locator('#calendar-detail')).to_contain_text('基础 35 字 / 阳光小院')
        self.checkpoint('calendar-fixture-previous-month')
        empty_day = previous_first + timedelta(days=1)
        p.locator('#date-' + empty_day.isoformat()).click()
        expect(p.locator('#calendar-detail')).to_contain_text('这天暂无已保存的学习记录')
        self.checkpoint('calendar-empty-day')
        p.get_by_role('button', name='上个月', exact=True).click()
        expect(p.locator('#calendar-title')).to_have_text(earlier_last.strftime('%Y-%m'))
        cell = p.locator('#date-' + earlier_last.isoformat())
        cell.focus()
        cell.press('Enter')
        expect(cell).to_have_attribute('aria-pressed', 'true')
        expect(p.locator('#calendar-detail')).to_contain_text('17 学习小步')
        expect(p.locator('#calendar-detail')).to_contain_text('小兔出门')
        expect(p.locator('#calendar-detail')).to_contain_text('基础 35 字')
        p.get_by_label('课程', exact=True).select_option('sprout-3')
        expect(p.locator('#calendar-detail')).to_contain_text('16 学习小步')
        expect(p.locator('#calendar-detail')).not_to_contain_text('基础 35 字')
        self.checkpoint('calendar-progressive-filter')
        p.get_by_label('课程', exact=True).select_option('sprout-2')
        expect(p.locator('#calendar-detail')).to_contain_text('1 学习小步')
        expect(p.locator('#calendar-detail')).not_to_contain_text('小兔出门')
        p.get_by_label('课程', exact=True).select_option('')
        expect(p.locator('#calendar-detail')).to_contain_text('17 学习小步')
        p.get_by_role('button', name='下个月', exact=True).click()
        expect(p.locator('#calendar-title')).to_have_text(previous_first.strftime('%Y-%m'))
        p.get_by_role('button', name='回到今天', exact=True).click()
        expect(p.locator('#calendar-title')).to_have_text(today.strftime('%Y-%m'))
        expect(p.locator('#date-' + today.isoformat())).to_have_attribute('aria-pressed', 'true')
        expect(p.locator('#calendar-detail')).to_contain_text('这天暂无已保存的学习记录')
        self.checkpoint('calendar-back-to-today')

    def test_pc_complete_learning_journey(self):
        self.learning_journey()

    def test_landscape_complete_learning_journey(self):
        self.learning_journey()

    def test_portrait_complete_learning_journey(self):
        self.learning_journey()

    def test_pc_calendar_dates_months_and_course_filter(self):
        self.calendar_fixture_journey()

    def test_landscape_calendar_dates_months_and_course_filter(self):
        self.calendar_fixture_journey()

    def test_portrait_calendar_dates_months_and_course_filter(self):
        self.calendar_fixture_journey()

    def test_landscape_pending_reconnect_reenables_parent_settings(self):
        p = self.page
        self.open_home()
        p.get_by_role('button', name='开始今天的冒险', exact=True).click()
        # Real browser transport failure; the app creates its own local pending event.
        self.context.route('**/api/event', lambda route: route.abort('connectionfailed'))
        p.get_by_role('button', name='大人已带读 / 讲解', exact=True).click()
        p.get_by_role('button', name='这一步练好了，继续', exact=True).click()
        expect(p.locator('#connection')).to_contain_text('这一步还没有同步到家庭服务器')
        self.assertEqual(self.server.store.state()['courses']['sprout-3']['positions']['1'], 0)
        self.open_parent()
        self.context.unroute('**/api/event')
        p.get_by_role('button', name='重新连接并同步', exact=True).click()
        expect(p.locator('#connection')).to_be_empty()
        for label in ('认读目标字数', '目标日期（可留空）', '每日新字参考', '每次分钟参考'):
            expect(p.get_by_label(label, exact=True)).to_be_enabled()
        expect(p.get_by_role('button', name='保存目标', exact=True)).to_be_enabled()
        p.get_by_label('每次分钟参考', exact=True).fill('25')
        p.get_by_role('button', name='保存目标', exact=True).click()
        expect(p.locator('#settings-status')).to_contain_text('目标已保存')
        self.assertEqual(self.server.store.settings()['reference_minutes'], 25)
        self.assertEqual(self.server.store.state()['courses']['sprout-3']['positions']['1'], 1)
        p.reload()
        # Reload intentionally restores the parent arithmetic gate.
        p.get_by_label('3 + 4 等于几？', exact=True).fill('7')
        p.get_by_role('button', name='进入家长小窗', exact=True).click()
        expect(p.get_by_label('每次分钟参考', exact=True)).to_have_value('25')
        self.checkpoint('pending-synced-settings-persisted')
