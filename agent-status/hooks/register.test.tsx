import { expect, test } from 'claude-code/testing'

import { clawd, touchOf } from './register'

const PANE = {
  plugin: 'agent-status',
  component: 'Pane',
  requestId: 'agent-status',
  props: {
    title: '担当の進行状態',
    isFocused: false,
    bodyColumns: 60,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 20 },
    view: {},
  },
} as const

test('道具ごとに「どこを触っているか」を1行にする', async () => {
  expect(touchOf('Write', { file_path: 'D:\\SNS\\05_投稿案\\1116_threads.md' })).toBe(
    '✍ 書き込み中：05_投稿案/1116_threads.md',
  )
  expect(touchOf('Read', { file_path: '/a/b/連絡票/1116週.md' })).toBe('📄 読込中：連絡票/1116週.md')
  expect(touchOf('WebSearch', { query: '共働き 夕飯 時短' })).toBe('🔍 検索中：「共働き 夕飯 時短」')
  expect(touchOf('WebFetch', { url: 'https://example.com/a' })).toBe('🌐 閲覧中：https://example.com/a')
  expect(touchOf('Bash', { command: 'ls -la\necho hi' })).toBe('⚙ 実行中：ls -la')
  expect(touchOf('TodoWrite', { todos: [] })).toBeUndefined()
})

test('状態ごとにキャラの色と動きが変わる', async () => {
  expect(clawd('running')).toContain('#D97757')
  expect(clawd('running')).toContain('0.6s')
  expect(clawd('completed')).toContain('#6f9f5f')
  expect(clawd('completed')).not.toContain('animateTransform')
  expect(clawd('failed')).toContain('#d9534f')
  expect(clawd('idle')).toContain('2s')
})

test('作業中の担当に触っている場所が出る', async ($, on) => {
  on('clock.now', () => ({ value: 1_000_000 }))
  on('clock.every', () => ({ value: {} }) as never)
  on('command.register', () => ({ value: { command: 'agent-status' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('agent.spawn', () => ({ model: 'x', agentId: 'a1' }))
  on('agent.list', () => ({ value: [{ id: 'a1', status: 'running' }] }) as never)
  on('tool.call', () => ({ result: {} }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.agent.spawn({ description: 'Threads4本を書く', subagentType: 'sns-threads-writer', prompt: 'p' } as never)
  await $.tool.call({ tool: 'Write', file_path: '/x/05_投稿案/1116.md', content: 'a', agentId: 'a1' })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /書き込み中/ }))?.text).toBe('✍ 書き込み中：05_投稿案/1116.md')
  await ui.unmount()

  const term = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect((await term.find({ type: 'Text', text: /Threads4本/ }))?.text).toBe('⏳ 作業中　Threads4本を書く')
  await term.unmount()
})
