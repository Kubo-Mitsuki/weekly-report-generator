# 指示A: 週報ツールの描画を切り出し、Node CLI を作り、週の範囲を直す

## 背景
このリポジトリ（Kubo-Mitsuki/weekly-report-generator）は、研究室の週次「活動報告スライド」（先週・今週の2枚の.pptx）を作るWebアプリ。`index.html` 1ファイルに全部入っていて、PptxGenJS 3.12.0 をCDNから読み、GitHub Pagesで main の直下を公開している。
今後、同じ描画をWeb画面・NodeのCLI・将来のMCPから使うため、スライドの描画とレイアウトの値を別ファイルに切り出す。
今回は**見た目を変えない作り替え**と、日付の範囲のバグ修正1件だけを行う。デザインの変更と入力画面の作り直しは次の指示で行うので、今回は触らない。

## 守ること
- 最新の main から `cloud/layout-cli` を切り、そこへコミットして push する。同名のブランチがすでにあれば、作業せずに止めて報告する。**main へのpush・マージ、force push、GitHub Pages の設定変更はしない**
- 依存は `pptxgenjs`（`"3.12.0"` と完全一致で固定）と `jszip`（devDependencies）だけ。`package-lock.json` もコミットする。テストは Node 標準の `node:test` で書く（Node 20 以上を前提）
- `index.html` の `onclick="generate()"` などのインラインのイベントは、今のまま動くこと。ダウンロードして `file://` で開く使い方はしないので、ESモジュールの別ファイルにしてよい
- 下の「作業」に無い改良（範囲を広げたリファクタ、文言やUIの変更）はしない。気づいたことは報告に書くだけにする
- テスト用のデータの名前は 山田 太郎 / Yamada Taro にする

## 入力データの形（`collectData()` が返すもの。CLIの入力JSONもこれ）
```json
{
  "grade": "B4", "name_ja_sei": "山田", "name_ja_mei": "太郎", "name_en": "Yamada Taro",
  "date": "2026/10/20", "fn_format": "sei", "lang": "ja",
  "last_week": { "hours": ["3","","6","","","",""],
                 "goals": [{"goal":"…","achievement":"80%","summary":"…"}],
                 "others": [{"summary":"…"}] },
  "this_week": { "hours": ["","","","","","",""], "goals": [], "others": [] }
}
```
値はすべて文字列。`hours[i]` は Date 列の i 番目の日に対応する。`date` の解釈は今の `parseDate` と同じにする（`/` と `-` を受け付ける。厳密化しない）。日付はすべて実行環境のローカル時刻の `Date` で扱う（今のまま）。

## 作業

### コミット1: 描画とレイアウトの切り出し（出力を変えない）
1. `layout.js`（ESモジュール）: `buildSlide` に直書きされている値をすべてここへ移す。対象は、各要素の x・y・w・h、表の colW・rowH、文字の大きさ・太字・色（`ACCENT1`・`ACCENT3`・`BAND_*` など）、書体（`FONT`）、枠線、**スライドに描かれる固定の文字列すべて**（「先週の目標とその進捗\nLast week's goals and progress」「その他取り組むこと…」「Date」「在室時間」「目標」「達成度」「概要」）、行数（目標4行・その他4行・在室7日）
2. `slide.js`（ESモジュール）: 次を export する。どれもDOMに触れず、`pptxgenjs` を import しない（インスタンスを引数で受け取る）
   - `buildSlide`: 今の関数を移す。**引数の形は今のまま**（`pptx, nameJa, nameEn, dateLabel, dates, sec, slideLabel, othersLabel`）。値は `layout.js` から読む
   - `buildDeck(pptx, data)`: 今の `generate()` の 893〜906 行にあたる部分（氏名と日付の組み立て、`weekDates` 2回、`buildSlide` 2回）。`pptx.layout` の設定もここで行う
   - `fileNameFor(data)`: 今の 908〜920 行（拡張子なし。不可視文字の除去と置換の規則はそのまま）
   - `validate(data)`: 問題の配列を返す。各要素は `{ field, message }`。field は `name`・`name_en`・`date`（今の `generate()` の3つの検査と同じ順・同じ条件）と、`last_week.goals`・`this_week.goals`・`last_week.others`・`this_week.others`（5件以上）、`last_week.hours`・`this_week.hours`（8個以上）。message は日本語の短い文
   - `parseDate`・`fmtMD`・`fmtDate`・`weekDates`（今の関数を移す）
3. `index.html`: 上の関数の定義を消し、`slide.js` から使う（定義を2か所に残さない）。インラインの script は classic のままにし、必要な所で `await import('./slide.js')` する。`generate()` は classic script に残し、画面側の仕事（`collectData`・`autoSave`・`new PptxGenJS()`・`writeFile`・`setStatus`）だけを持たせる。入力エラーの表示は今と同じ文言（`t('err_input') + ': ' + field` の形で、最初の1件）にする。読み込み前に `updateDates` が走っても、画面の日付表示が今と同じになるようにする
4. `package.json`（`"type": "module"`、`npm test`）と `.gitignore`（`node_modules/`、生成した .pptx）を足す

### コミット1の検算（このコミットの完了条件）
- `legacy/old_slide.mjs`: コミット `dc9a62d`（今の main の先頭）の `index.html` から、`buildSlide`・`weekDates`・`fmtMD`・`parseDate` と、それが使う定数を写し、`export` を足しただけの凍結版。加えて、`generate()` の 893〜906 行（898行の `const pptx = new PptxGenJS();` だけは除き、引数の `pptx` を使う）を、中身を変えずに `export function buildDeckLegacy(pptx, data) { … }` で包んで置く。**変えてよいのは、export を足すことと、この包む関数を1つ作ることだけ**。以後このファイルは直さない（比較の基準）
- `test/fixtures/` に入力JSONを6件以上置く: ①空欄が多い（目標1件・在室1日だけ） ②目標4件・その他4件・在室7日すべて埋まる ③概要が枠を超えるほど長い ④`"lang": "en"` ⑤月またぎの基準日（2026/10/27） ⑥年またぎ（2026/12/29）
- `tools/compare_pptx.mjs <a.pptx> <b.pptx>`: 2つの.pptxを jszip で開き、**中のファイルどうしを文字列で比べる**（.pptx自体のバイト列は比べない）。`docProps/core.xml` だけは除外する（作成日時が入る。手元で同じ入力から2回作り、違うのはこの1ファイルだけと確かめてある）。違えば、そのファイル名と、最初に違う文字位置の前後80文字を出して終了コード1。全部同じなら0
- テスト: 全フィクスチャで、凍結版の `buildDeckLegacy` と新しい `buildDeck` で作った.pptx が、上の比較で全ファイル一致すること。両方とも Node の npm 版 pptxgenjs で作る
- 一致しない差が消えないときは、合わせ込まずに止めて、差の中身を報告する

### コミット2: Node CLI
- `cli/generate.mjs`: `node cli/generate.mjs <input.json> [-o <出力.pptx>]`
  - パスはカレントディレクトリ基準。出力先に同名があれば上書きする。出力先のフォルダが無ければエラー
  - JSONが読めない・壊れている、`validate` で問題がある、書き込みに失敗した、のどれでも、理由を標準エラーに出して終了コード1（`validate` の問題は全部出す）
  - `-o` が無ければ `fileNameFor(data) + '.pptx'` をカレントディレクトリに書く
  - 成功したら、書いたファイルのパスを標準出力に1行だけ出す
- `README.md` を新しく作る: Web版の使い方（公開URL https://kubo-mitsuki.github.io/weekly-report-generator/ ）、CLIの使い方、入力JSONの形（上の例と各項目の意味）、`npm test` と `compare_pptx.mjs` の使い方
- テスト: フィクスチャ①からCLIで.pptxができること、名前が空のJSON・目標5件のJSONで終了コード1になること

### コミット3: 週の範囲を直す（ここで初めて出力が変わる）
- 今の `weekDates` は、今週の欄が「基準日の翌日〜7日後」、先週の欄が「基準日の7日前〜前日」。**基準日（ゼミ当日）がどちらの欄にも入らないのがバグ**
- 直したあと: **今週＝基準日〜6日後（基準日が先頭の列）、先週＝基準日の7日前〜前日（変更なし）**。画面の日付表示もスライドも、同じ `weekDates` から作られるので両方変わる
- テスト1（`weekDates` 単体）: 基準日 2026/10/20 で、今週＝10/20〜10/26、先週＝10/13〜10/19。2026/10/27 と 2026/12/29 でも、7個の日付を手で書いた期待値と比べる
- テスト2（描画）: コミット1の比較テストを次の形に改める。凍結版の `buildSlide` は `dates` を引数で受け取るので、**凍結版の `buildSlide` に新しい `weekDates` の結果を渡して作った.pptx** と、新しい `buildDeck` の.pptx が全ファイル一致すること。これで「日付以外は何も変わっていない」ことを確かめる

## ブラウザでの確認（任意）
できれば headless ブラウザ（Playwright など。package.json には入れず一時的に使う）で `index.html` を開き、名前と基準日を入れて「出力」を押し、.pptx が保存されること、画面の Date 表示が直っていること、コンソールにエラーが無いことを確かめる。できなければ、報告に「ブラウザでは未確認」と書く（こちらの手元で確かめる）。

## 報告に書くこと
1. コミットの一覧（ハッシュと1行の説明）
2. `npm test` の結果（件数と合否）
3. フィクスチャごとの比較結果
4. ブラウザでの確認の結果、または未確認であること
5. **この指示に書かれていなかったことで、自分で決めたこと**の一覧
6. 気づいたが直さなかったこと
