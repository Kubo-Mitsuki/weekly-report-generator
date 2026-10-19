#!/usr/bin/env node
// 使い方: node cli/generate.mjs <input.json> [-o <出力.pptx>]
// 入力 JSON から週報スライド（.pptx）を作る。成功したら書いたファイルのパスを標準出力に1行出す。
// 失敗したら理由を標準エラーに出して終了コード 1。

import { readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import PptxGenJS from 'pptxgenjs';
import { buildDeck, fileNameFor, validate } from '../slide.js';

const USAGE = '使い方: node cli/generate.mjs <input.json> [-o <出力.pptx>]';

function fail(...lines) {
  for (const line of lines) console.error(line);
  process.exit(1);
}

function parseArgs(argv) {
  let input = null;
  let output = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-o') {
      if (i + 1 >= argv.length) fail('-o に出力先が指定されていません', USAGE);
      output = argv[++i];
    } else if (a.startsWith('-') && a !== '-') {
      fail(`不明なオプション: ${a}`, USAGE);
    } else if (input === null) {
      input = a;
    } else {
      fail(`入力ファイルが複数指定されています: ${input}, ${a}`, USAGE);
    }
  }
  if (input === null) fail(USAGE);
  return { input, output };
}

const { input, output } = parseArgs(process.argv.slice(2));

let data;
try {
  data = JSON.parse(await readFile(input, 'utf8'));
} catch (err) {
  fail(`入力 JSON を読めません: ${input}`, String(err.message || err));
}
if (data === null || typeof data !== 'object' || Array.isArray(data)) {
  fail(`入力 JSON はオブジェクトである必要があります: ${input}`);
}

const problems = validate(data);
if (problems.length) {
  fail(...problems.map(p => `入力エラー: ${p.field}: ${p.message}`));
}

let outPath = output;
if (outPath === null) {
  const base = fileNameFor(data);
  if (!base) fail('ファイル名を決められません。-o で出力先を指定してください');
  outPath = `${base}.pptx`;
}

try {
  const dir = path.dirname(outPath);
  const s = await stat(dir).catch(() => null);
  if (!s || !s.isDirectory()) fail(`出力先のフォルダがありません: ${dir}`);

  const pptx = new PptxGenJS();
  buildDeck(pptx, data);
  const buf = await pptx.write({ outputType: 'nodebuffer' });
  await writeFile(outPath, buf);
} catch (err) {
  fail(`書き込みに失敗しました: ${outPath}`, String(err.message || err));
}

console.log(outPath);
