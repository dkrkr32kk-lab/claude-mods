import { expect, test } from 'claude-code/testing'

import { bar, line, resetLabel } from './register'

// 2026-11-04 12:00 JST
const NOW = Date.parse('2026-11-04T03:00:00Z')

test('残り％に合わせて四角の数と色が変わる', async () => {
  expect(bar(100)).toBe('🟩🟩🟩🟩🟩')
  expect(bar(62)).toBe('🟩🟩🟩⬜⬜')
  expect(bar(50)).toBe('🟩🟩🟩⬜⬜')
  expect(bar(49)).toBe('🟨🟨⬜⬜⬜')
  expect(bar(18)).toBe('🟥⬜⬜⬜⬜')
  expect(bar(3)).toBe('🟥⬜⬜⬜⬜')
  expect(bar(0)).toBe('⬜⬜⬜⬜⬜')
})

test('回復時刻は今日中なら時刻だけ、それ以外は日付も', async () => {
  expect(resetLabel('2026-11-04T09:00:00Z', NOW)).toBe('18:00')
  expect(resetLabel('2026-11-07T00:00:00Z', NOW)).toBe('11/7 9:00')
  // JSTで日付が変わった直後は「明日」
  expect(resetLabel('2026-11-04T15:30:00Z', NOW)).toBe('11/5 0:30')
})

test('1行にまとめる', async () => {
  expect(
    line(
      [
        { kind: 'five_hour', percentUsed: 38, resetsAt: '2026-11-04T09:00:00Z' },
        { kind: 'seven_day', percentUsed: 82, resetsAt: '2026-11-07T00:00:00Z' },
        { kind: 'spend_limit', percentUsed: 10 },
      ],
      NOW,
    ),
  ).toBe('5h🟩🟩🟩⬜⬜62%↻18:00 週🟥⬜⬜⬜⬜18%↻11/7 9:00')
  expect(line([], NOW)).toBe('使用量：次の返事で表示')
})

test('起動時と計測時にステータス行を書く', async ($, on) => {
  const shown: (string | undefined)[] = []
  on('clock.now', () => ({ value: NOW }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.measure', (_, e) => ({ changed: e.changed }))
  on('session.usage', () => ({
    value: { startedAt: 0, context: { window: 400000 }, rateLimits: [] },
  }))
  on('ui.status', (_, e) => {
    shown.push(e.text)
    return { value: undefined }
  })

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(shown.at(-1)).toBe('使用量：次の返事で表示')

  await $.session.measure({
    context: { window: 400000 },
    rateLimits: [{ kind: 'five_hour', percentUsed: 90, resetsAt: '2026-11-04T09:00:00Z' }],
    changed: ['rateLimits'],
  })
  expect(shown.at(-1)).toBe('5h🟥⬜⬜⬜⬜10%↻18:00')
})
