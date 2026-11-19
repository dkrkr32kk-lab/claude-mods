// 依頼の重さ
export type Level = '軽い' | '普通' | '重い'

// 直近の判定結果（入力欄の上の1行に出す）
export type Decision = {
  level: Level
  // 判定のよりどころ（キーワード／前回と同じ／Haiku判定／判定失敗）
  how: string
  // 実際に使うモデルの別名（sonnet／opus）とエフォート
  model: string
  effort: 'low' | 'medium' | 'high' | 'xhigh' | 'max'
  // 会話が長いため、判定どおりのモデルに切替えず今のモデルのままにした時 true
  isHeld: boolean
  // 判定どおりなら使うはずだったモデル
  wanted: string
}

declare module 'claude-code' {
  interface PluginState {
    'auto-model': {
      last: Shaped<Decision | null>
      isOff: boolean
      tokens: number
      // 止めている理由（再開中は空）
      offReason: string
      // 直前の返事で実際に使ったモデルとエフォート（例：claude-opus-5-5・medium）
      lastUsed: string
    }
  }
}
