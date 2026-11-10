# claude-mods

Claude Code 用のMOD（フックで画面を足すプラグイン）を2つまとめたリポジトリです。

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

## インストール

### デスクトップアプリ（Code タブ）

1. 入力欄の横の「＋」→「Plugins」を開く
2. 「Add marketplace」に `dkrkr32kk-lab/claude-mods` を入れる
3. 「Add plugin」から `usage-meter` と `agent-status` を追加する

### ターミナル版の Claude Code

```
/plugin install usage-meter --marketplace dkrkr32kk-lab/claude-mods
/plugin install agent-status --marketplace dkrkr32kk-lab/claude-mods
```

「Add marketplace?」と聞かれたら `y`、範囲は一番上（user）のまま Enter。

シェルからなら次でも入ります。

```
claude plugin install usage-meter --marketplace dkrkr32kk-lab/claude-mods
claude plugin install agent-status --marketplace dkrkr32kk-lab/claude-mods
```

入れたあと、新しいセッションから表示されます。
