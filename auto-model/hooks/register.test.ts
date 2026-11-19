import { expect, test } from 'claude-code/testing'

import { byKeyword, decide, family, grownTokens, isReply, nextBase, WARN_TOKENS } from './register'

test('長さは会話で増えた分で数える', () => {
  // 基準がまだ無い時は 0
  expect(grownTokens(79_000, 0)).toBe(0)
  // 最初の返事が約7.9万なら、それを基準にする
  expect(nextBase(79_000, 0)).toBe(79_000)
  expect(nextBase(120_000, 79_000)).toBe(79_000)
  expect(grownTokens(120_000, 79_000)).toBe(41_000)
  // /clear や圧縮で減ったら基準を下げる
  expect(nextBase(30_000, 79_000)).toBe(30_000)
  // 量がまだ入っていない時は基準を変えない
  expect(nextBase(0, 79_000)).toBe(79_000)
})

test('最初の依頼は、増えた分が多くても据え置かない', () => {
  const d = decide('軽い', 'キーワード', 200_000, 'opus', true)
  expect(d.model).toBe('sonnet')
  expect(d.isHeld).toBe(false)
})

test('全体が8万でも増えた分が少なければ切替える', () => {
  const d = decide('重い', 'キーワード', grownTokens(85_000, 79_000), 'sonnet')
  expect(d.model).toBe('opus')
  expect(d.isHeld).toBe(false)
})

test('キーワードで重さが決まる', () => {
  expect(byKeyword('集計マクロのVBAを改修して')).toBe('重い')
  expect(byKeyword('設計を考えて')).toBe('重い')
  expect(byKeyword('そのフォルダを開いて')).toBe('軽い')
  expect(byKeyword('今日の予定について')).toBe(undefined)
})

test('返事だけの依頼は前回と同じ扱い', () => {
  expect(isReply('はい、お願いします')).toBe(false)
  expect(isReply('お願いします')).toBe(true)
  expect(isReply('OK')).toBe(true)
  expect(isReply('OK、でもボタンの色は青で')).toBe(false)
})

test('モデル名から系統を取り出す', () => {
  expect(family('claude-opus-5-5')).toBe('opus')
  expect(family('claude-sonnet-5-5[1m]')).toBe('sonnet')
  expect(family(undefined)).toBe(undefined)
})

test('会話が短ければ判定どおりに切替える', () => {
  const d = decide('重い', 'キーワード', 1000, 'sonnet')
  expect(d.model).toBe('opus')
  expect(d.effort).toBe('high')
  expect(d.isHeld).toBe(false)
})

test('会話が長ければモデルは据え置き、エフォートだけ変える', () => {
  const d = decide('軽い', 'キーワード', WARN_TOKENS, 'opus')
  expect(d.model).toBe('opus')
  expect(d.effort).toBe('medium')
  expect(d.isHeld).toBe(true)
  expect(d.wanted).toBe('sonnet')
})

test('会話が長くても同じモデルなら据え置き扱いにしない', () => {
  const d = decide('重い', 'キーワード', 200_000, 'opus')
  expect(d.isHeld).toBe(false)
})
