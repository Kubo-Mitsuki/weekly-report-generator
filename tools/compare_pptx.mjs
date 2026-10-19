// 使い方: node tools/compare_pptx.mjs <a.pptx> <b.pptx>
// 2つの .pptx の中のファイルどうしを文字列で比べる（.pptx 自体のバイト列は比べない）。
// docProps/core.xml は作成日時が入るので除外する。
// 全部同じなら終了コード 0。違えば、そのファイル名と最初に違う位置の前後80文字を出して終了コード 1。

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const EXCLUDE = new Set(['docProps/core.xml']);

async function loadFiles(source) {
  const zip = await JSZip.loadAsync(source);
  const files = new Map();
  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir || EXCLUDE.has(name)) continue;
    files.set(name, await entry.async('string'));
  }
  return files;
}

// 差があれば、差の説明の配列を返す。同じなら空配列。
export async function comparePptx(a, b) {
  const [fa, fb] = await Promise.all([loadFiles(a), loadFiles(b)]);
  const diffs = [];
  const names = [...new Set([...fa.keys(), ...fb.keys()])].sort();
  for (const name of names) {
    if (!fa.has(name)) { diffs.push(`${name}: 1つ目に無い`); continue; }
    if (!fb.has(name)) { diffs.push(`${name}: 2つ目に無い`); continue; }
    const x = fa.get(name), y = fb.get(name);
    if (x === y) continue;
    let i = 0;
    while (i < x.length && i < y.length && x[i] === y[i]) i++;
    const from = Math.max(0, i - 80);
    diffs.push(
      `${name}: 文字位置 ${i} で違う\n` +
      `  a: ${JSON.stringify(x.slice(from, i + 80))}\n` +
      `  b: ${JSON.stringify(y.slice(from, i + 80))}`
    );
  }
  return diffs;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [pa, pb] = process.argv.slice(2);
  if (!pa || !pb) {
    console.error('使い方: node tools/compare_pptx.mjs <a.pptx> <b.pptx>');
    process.exit(2);
  }
  try {
    const diffs = await comparePptx(await readFile(pa), await readFile(pb));
    if (diffs.length) {
      console.log(diffs.join('\n'));
      process.exit(1);
    }
    console.log('一致');
  } catch (err) {
    console.error(String(err));
    process.exit(2);
  }
}
