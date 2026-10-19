# weekly-report-generator

研究室の週次「活動報告スライド」（先週・今週の2枚の .pptx）を作るツールです。
Web 画面と Node の CLI の両方が、同じ描画コード（`slide.js`・`layout.js`）を使います。

## Web版

https://kubo-mitsuki.github.io/weekly-report-generator/

画面はスライドと同じ形の面になっています（位置・大きさ・色は `layout.js` から作ります。先週は青、今週は橙、「その他」は緑。見出しの「先週」「今週」は週の色の札）。
面のセルを押して、目標・概要・その他の文字を直接入力し、在室時間と達成度はスライダー（または数字の直接入力）で決めます。
文字が多くて枠から出るセルは赤枠になります（目安の警告で、PowerPoint の描画とは少しずれます）。
達成度が数字だけのときは、スライドと面に「90%」のように % が付きます（保存するデータは数字のまま）。
入力したら「出力」を押すと、.pptx が保存されます。入力内容はブラウザに自動保存されます。

## CLI

Node 20 以上が必要です。

```sh
npm install
node cli/generate.mjs <input.json> [-o <出力.pptx>]
```

- パスはカレントディレクトリ基準です。出力先に同名のファイルがあれば上書きします。出力先のフォルダが無いとエラーです。
- `-o` を省略すると、ファイル名の規則（`B4_山田.pptx` など）でカレントディレクトリに書きます。
- 成功すると、書いたファイルのパスを標準出力に1行だけ出します。
- JSON が読めない、入力に問題がある、書き込みに失敗した、のどれでも、理由を標準エラーに出して終了コード 1 になります（入力の問題は全部出します）。

例:

```sh
node cli/generate.mjs test/fixtures/02_full.json -o report.pptx
```

## 入力JSONの形

Web 画面の `collectData()` が返すものと同じです。画面の「JSONを書き出す」で保存したJSONは、そのまま CLI に渡せます（逆に、CLI の入力JSONは画面の「JSONを読み込む」で読み込めます）。値はすべて文字列です。

```json
{
  "grade": "B4",
  "name_ja_sei": "山田",
  "name_ja_mei": "太郎",
  "name_en": "Yamada Taro",
  "date": "2026/10/20",
  "fn_format": "sei",
  "lang": "ja",
  "last_week": {
    "hours": ["3", "", "6", "", "", "", ""],
    "goals": [{ "goal": "…", "achievement": "80%", "summary": "…" }],
    "others": [{ "summary": "…" }]
  },
  "this_week": { "hours": ["", "", "", "", "", "", ""], "goals": [], "others": [] }
}
```

| 項目 | 意味 |
| --- | --- |
| `grade` | 学年（ファイル名の先頭に入る。空でもよい） |
| `name_ja_sei` / `name_ja_mei` | 日本語の苗字・名前。スライドには続けて「山田太郎」と載る。苗字は必須 |
| `name_en` | ローマ字の氏名。必須 |
| `date` | 基準日（ゼミ実施日）。`YYYY/MM/DD` または `YYYY-MM-DD` |
| `last_week` / `this_week` の日付列 | 今週は基準日〜6日後（基準日が先頭）、先週は基準日の7日前〜前日 |
| `fn_format` | ファイル名の形式。`"sei"` なら `学年_苗字`、`"sei_mei"` なら `学年_苗字_名前` |
| `lang` | 画面の言語（`ja` `zh` `ko` `en`）。スライドの内容には影響しない |
| `last_week` / `this_week` | 先週・今週のスライド1枚ぶん |
| `hours` | 在室時間。Date 列の左から順に7日ぶん（8個以上はエラー） |
| `goals` | 目標。`goal`（目標）・`achievement`（達成度）・`summary`（概要）。4件まで |
| `others` | その他の取り組み。`summary` のみ。4件まで |

## テスト

```sh
npm test
```

Node 標準の `node:test` を使います。主な内容:

- `test/render.test.mjs`: `legacy/old_slide.mjs`（コミット `dc9a62d` の描画を写した凍結版。直さない）と、旧の見た目（両週とも旧の青・「その他」も旧の緑・見出し1つのまとまりで18pt・% なし）を `opts` で渡した `slide.js` の `buildDeck` で作った .pptx が、全フィクスチャで一致すること。あわせて、今週が橙・先週が青・「その他」が緑であること、見出しの札・続く文字・英語の行、「その他」の見出し、達成度の % も確かめる
- `test/slide.test.mjs`: `validate`・`validateImport`・`fileNameFor`
- `test/cli.test.mjs`: CLI の成功と、失敗時の終了コード

`test/fixtures/` に入力 JSON のサンプルがあります。

### 2つの .pptx を比べる

```sh
node tools/compare_pptx.mjs a.pptx b.pptx
```

.pptx の中のファイルどうしを文字列で比べます（.pptx 自体のバイト列は比べません）。作成日時が入る `docProps/core.xml` は除外します。
全部同じなら `一致` と出して終了コード 0、違えば、ファイル名と最初に違う位置の前後80文字を出して終了コード 1 です。
