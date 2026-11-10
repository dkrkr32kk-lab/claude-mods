import { atom, read, update } from 'claude-code'
import type { AgentStatus, EngineInterface, Register } from 'claude-code'

import type { AgentTrack } from '../types'

const PANE = 'agent-status'
const TITLE = '担当の進行状態'
// Change the tag when AgentTrack's fields change: it declines what an earlier
// version stored, which outlives a reload.
const tracks = atom({ plugin: 'agent-status', key: 'tracks' } as const, [], {
  shape: 'tracks-2',
})

// キャラの絵が描けない画面（ターミナル）で使う印。
const LABEL: Record<AgentStatus, string> = {
  pending: '⏸ 待ち',
  running: '⏳ 作業中',
  waiting: '⏳ 確認待ち',
  idle: '💤 待機',
  completed: '✅ 完了',
  failed: '❌ 失敗',
  killed: '⛔ 停止',
}

const WORD: Record<AgentStatus, string> = {
  pending: '待ち',
  running: '作業中',
  waiting: '確認待ち',
  idle: '待機',
  completed: '完了',
  failed: '失敗',
  killed: '停止',
}

// 状態ごとのキャラの色と動き：はねる／止まる／ゆっくり揺れる。
const LOOK: Record<AgentStatus, { color: string; motion?: 'hop' | 'sway' }> = {
  pending: { color: '#8a8a8a', motion: 'sway' },
  running: { color: '#D97757', motion: 'hop' },
  waiting: { color: '#D97757', motion: 'hop' },
  idle: { color: '#8a8a8a', motion: 'sway' },
  completed: { color: '#6f9f5f' },
  failed: { color: '#d9534f' },
  killed: { color: '#d9534f' },
}

const MOTION = {
  hop: '<animateTransform attributeName="transform" type="translate" values="0 0;0 -0.8;0 0" dur="0.6s" repeatCount="indefinite"/>',
  sway: '<animateTransform attributeName="transform" type="translate" values="0 0;0 -0.4;0 0" dur="2s" repeatCount="indefinite"/>',
}

// Claude Code風のドット絵（11x7マス）。公式の画像ではなく、似せて描いたもの。
export const clawd = (status: AgentStatus) => {
  const { color, motion } = LOOK[status]

  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="33" height="24" viewBox="0 -1 11 8" shape-rendering="crispEdges">' +
    `<g fill="${color}">` +
    '<rect x="1" y="0" width="9" height="5"/>' +
    '<rect x="0" y="2" width="1" height="1"/><rect x="10" y="2" width="1" height="1"/>' +
    '<rect x="2" y="5" width="1" height="2"/><rect x="4" y="5" width="1" height="2"/>' +
    '<rect x="6" y="5" width="1" height="2"/><rect x="8" y="5" width="1" height="2"/>' +
    '<rect x="3" y="1" width="1" height="1" fill="#000"/><rect x="7" y="1" width="1" height="1" fill="#000"/>' +
    (motion ? MOTION[motion] : '') +
    '</g></svg>'
  )
}

const minutes = (ms: number) => {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)

  return m > 0 ? `${m}分${s}秒` : `${s}秒`
}

const cut = (text: string, max: number) => (text.length > max ? `${text.slice(0, max)}…` : text)

// 長いパスは最後の2階層だけにする。
const shortPath = (path: string) => path.split(/[\\/]/).filter(Boolean).slice(-2).join('/')

// 道具の入力から「どこを触っているか」の1行を作る。分からない道具は undefined。
export const touchOf = (tool: string, input: Record<string, unknown>) => {
  const text = (key: string) => (typeof input[key] === 'string' ? (input[key] as string) : undefined)
  const file = text('file_path') ?? text('notebook_path')
  const url = text('url')

  if ((tool === 'Write' || tool === 'Edit' || tool === 'NotebookEdit') && file) {
    return `✍ 書き込み中：${shortPath(file)}`
  }
  if (tool === 'Read' && file) return `📄 読込中：${shortPath(file)}`
  if (tool === 'WebSearch' && text('query')) return `🔍 検索中：「${cut(text('query')!, 40)}」`
  if ((tool === 'Grep' || tool === 'Glob') && text('pattern')) {
    return `🔍 検索中：「${cut(text('pattern')!, 40)}」`
  }
  if (url) return `🌐 閲覧中：${cut(url, 60)}`
  if ((tool === 'Bash' || tool === 'PowerShell') && text('command')) {
    return `⚙ 実行中：${cut(text('command')!.split('\n')[0]!, 50)}`
  }

  return undefined
}

// 担当が動いている間は、経過時間が止まって見えないようにパネルを描き直す。
const tick = async ($: EngineInterface) => {
  const list = await $.agent.list()
  if (list.some(a => a.status === 'running' || a.status === 'waiting')) {
    $.ui.invalidate('ui.render')
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    $.clock.every(5000, () => void tick($))

    await $.command.register({
      name: 'agent-status',
      description: '担当（サブエージェント）の進行状態をペインに出す',
    })

    return next(e)
  })

  on('command.run', { command: 'agent-status' }, async $ => {
    await $.ui.open({ id: PANE, title: TITLE })

    return { text: '担当の進行状態のペインを開きました。' }
  })

  on('agent.spawn', async ($, e, next) => {
    const started = await next(e)
    if (started.agentId) {
      const now = await $.clock.now()
      const id = started.agentId
      await update($, tracks, list => {
        const known = list.find(t => t.id === id)
        // A resumed agent (SendMessage) keeps its counts and starts a new leg.
        const track: AgentTrack = known
          ? { ...known, description: e.description || known.description, startedAt: now, endedAt: undefined }
          : { id, description: e.description, type: e.subagentType, startedAt: now, tools: 0 }

        return [...list.filter(t => t.id !== id), track].slice(-30)
      })
      void $.ui.open({ id: PANE, title: TITLE })
    }

    return started
  })

  on('tool.call', async ($, e, next) => {
    const id = e.agentId
    if (id) {
      const touch = touchOf(e.tool, e as unknown as Record<string, unknown>)
      await update($, tracks, list =>
        list.map(t =>
          t.id === id ? { ...t, tools: t.tools + 1, lastTool: e.tool, touch: touch ?? t.touch } : t,
        ),
      )
    }

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    const id = e.agentId
    if (id) {
      const now = await $.clock.now()
      await update($, tracks, list => list.map(t => (t.id === id ? { ...t, endedAt: now } : t)))
    }

    return done
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const elements = $.ui.resolve(e)
    const { Box, Text } = elements
    const Svg = e.surface !== 'terminal' && 'Svg' in elements ? elements.Svg : undefined
    const list = await read($, tracks)
    const live = await $.agent.list()
    const now = await $.clock.now()
    const statusOf = new Map(live.map(a => [a.id, a.status] as const))

    if (list.length === 0) {
      return <Text dimColor>このセッションではまだ担当が動いていません。</Text>
    }

    return (
      <Box flexDirection="column">
        {[...list].reverse().map(t => {
          const status = statusOf.get(t.id) ?? (t.endedAt ? 'completed' : 'running')
          const isLive = status === 'running' || status === 'waiting'
          const took = (t.endedAt && !isLive ? t.endedAt : now) - t.startedAt

          return (
            <Box flexDirection="row" gap={1} marginBottom={1}>
              {Svg ? (
                <Svg source={clawd(status)} alt={WORD[status]} width={33} height={24} isInteractive />
              ) : undefined}
              <Box flexDirection="column">
                <Text bold={isLive} dimColor={!isLive}>
                  {Svg ? t.description : `${LABEL[status]}　${t.description}`}
                </Text>
                <Text dimColor>
                  {t.type} ・ 道具{t.tools}回 ・ {minutes(took)}
                  {Svg ? ` ・ ${WORD[status]}` : ''}
                </Text>
                {isLive && t.touch ? <Text>{t.touch}</Text> : undefined}
              </Box>
            </Box>
          )
        })}
      </Box>
    )
  })
}
