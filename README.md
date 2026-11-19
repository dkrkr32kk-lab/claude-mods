# claude-mods

Claude Code 用のMOD（フックで画面を足すプラグイン）を3つまとめたリポジトリです。

## usage-meter（使用量メーター）

入力欄の下に、5時間枠と週枠の使用量の残りを1行で常に表示します。

```
5h🟩🟩🟩⬜⬜62%↻18:00 週🟥⬜⬜⬜⬜18%↻11/7 9:00
```

- 四角5個（20％きざみ）。残り50％以上は🟩、20〜50％は🟨、20％未満は🟥
- `↻` の後ろは回復する時刻（日本時間で表示）
- 起動直後は「使用量：次の返事で表示」と出て、Claudeが1回返事をすると数字が出ます

## agent-status（担当の進行状態）

担当（サブエージェント）が動き始めると、会話の横に「担当の進行状態」パネルが開きます。担当ごとに次のことを表示します。

- 状態：Claude Code風のドット絵キャラの色と動き（作業中＝オレンジではねる、完了＝緑、失敗＝赤、待機＝灰色）
- 担当の種類・道具を使った回数・経過時間
- 作業中なら、いま触っている場所（書き込み中のファイル、検索語、開いているページなど）

`/agent-status` でいつでもパネルを開けます。キャラの絵は公式の画像ではなく、似せて描いたものです。

## auto-model（モデル・エフォートの自動切替）

依頼ごとに重さ（軽い・普通・重い）を判定して、Claude に送るモデルとエフォートを切り替えます。入力欄の上に1行で状態を出します。

```
自動切替：重い（キーワード）→ opus・high
直前の返事：claude-opus-5-5・high
```

| 重さ | モデル・エフォート | 例 |
|---|---|---|
| 軽い | Sonnet・medium | 開いて・一覧・どこ（60文字以内の短い依頼） |
| 普通 | Sonnet・high | 文章の作成・説明など |
| 重い | Opus・high | VBA・マクロ・設計・改修・原因調査など |

- まずキーワードで判定し、決まらない時だけ Haiku に判定させます。Haiku が答えられない時は「重い」にします
- 「はい」「お願いします」だけの返事は、前の依頼と同じ重さにします
- 会話が5万トークンを超えたら、モデルは切替えずエフォートだけ変えて通知を出します（切替えると会話の読み直しで大量に消費するため）。10万トークンを超えたら【要注意】を赤字で出します
- 担当（サブエージェント）のモデルは変えません
- 行の「止める」ボタンか `/auto-model` で、止める・再開を切り替えます
- 最初の依頼の後に `/model` やモデル選択欄で手動でモデルを替えると、自動切替が止まり、選んだモデルをそのまま使います
- 画面のモデル選択欄の表示は変わりません。Claude に「今のモデルは？」と聞いても、選択欄のモデルを答えます。実際に返事をしたモデルは「直前の返事：」の行で確かめます

## インストール

### デスクトップアプリ（Code タブ）

1. 入力欄の横の「＋」→「Plugins」を開く
2. 「Add marketplace」に `dkrkr32kk-lab/claude-mods` を入れる
3. 「Add plugin」から `usage-meter`・`agent-status`・`auto-model` を追加する

### ターミナル版の Claude Code

```
/plugin install usage-meter --marketplace dkrkr32kk-lab/claude-mods
/plugin install agent-status --marketplace dkrkr32kk-lab/claude-mods
/plugin install auto-model --marketplace dkrkr32kk-lab/claude-mods
```

「Add marketplace?」と聞かれたら `y`、範囲は一番上（user）のまま Enter。

シェルからなら次でも入ります。

```
claude plugin install usage-meter --marketplace dkrkr32kk-lab/claude-mods
claude plugin install agent-status --marketplace dkrkr32kk-lab/claude-mods
claude plugin install auto-model --marketplace dkrkr32kk-lab/claude-mods
```

入れたあと、新しいセッションから表示されます。
