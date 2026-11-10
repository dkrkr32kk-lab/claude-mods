import type { EngineInterface, Register, SessionRateLimit } from 'claude-code'

// 表示する枠と、その見出し。spend_limit など他の枠は出さない。
const WINDOWS: ReadonlyArray<readonly [string, string]> = [
  ['five_hour', '5h'],
  ['seven_day', '週'],
]
const WAITING = '使用量：次の返事で表示'
// 回復時刻は日本時間で書く（モジュールの環境のタイムゾーンに頼らない）。
const JST_OFFSET_MS = 9 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

// 四角5個（20％きざみ）。残りがあるうちは最低1個は塗る。
export const bar = (remaining: number) => {
  const color = remaining >= 50 ? '🟩' : remaining >= 20 ? '🟨' : '🟥'
  const filled = remaining > 0 ? Math.min(5, Math.max(1, Math.round(remaining / 20))) : 0

  return color.repeat(filled) + '⬜'.repeat(5 - filled)
}

// 今日中なら「18:00」、明日以降なら「11/7 9:00」。
export const resetLabel = (resetsAt: string, now: number) => {
  const at = Date.parse(resetsAt)
  if (Number.isNaN(at)) return undefined
  const local = new Date(at + JST_OFFSET_MS)
  const time = `${local.getUTCHours()}:${String(local.getUTCMinutes()).padStart(2, '0')}`
  const isToday =
    Math.floor((at + JST_OFFSET_MS) / DAY_MS) === Math.floor((now + JST_OFFSET_MS) / DAY_MS)

  return isToday ? time : `${local.getUTCMonth() + 1}/${local.getUTCDate()} ${time}`
}

export const line = (limits: readonly SessionRateLimit[], now: number) => {
  const parts = WINDOWS.flatMap(([kind, label]) => {
    const limit = limits.find(l => l.kind === kind)
    if (!limit) return []
    const remaining = Math.max(0, Math.round(100 - limit.percentUsed))
    const reset = limit.resetsAt ? resetLabel(limit.resetsAt, now) : undefined

    return [`${label}${bar(remaining)}${remaining}%${reset ? `↻${reset}` : ''}`]
  })

  return parts.length > 0 ? parts.join(' ') : WAITING
}

const show = async ($: EngineInterface, limits: readonly SessionRateLimit[]) =>
  $.ui.status(line(limits, await $.clock.now()))

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await show($, (await $.session.usage()).rateLimits)

    return started
  })

  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('rateLimits')) await show($, e.rateLimits)

    return next(e)
  })
}
