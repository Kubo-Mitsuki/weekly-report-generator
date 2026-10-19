import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { fixtures } from '../tools/test_helpers.mjs';

const CLI = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'cli', 'generate.mjs');

function run(args, cwd) {
  return spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8' });
}

function tmp() {
  return mkdtempSync(path.join(tmpdir(), 'weekly-cli-'));
}

test('フィクスチャ①から .pptx ができる（-o 指定）', async () => {
  const dir = tmp();
  try {
    const input = path.join(dir, 'in.json');
    writeFileSync(input, JSON.stringify(fixtures()[0].data));
    const r = run(['in.json', '-o', 'out.pptx'], dir);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout, 'out.pptx\n');
    const zip = await JSZip.loadAsync(readFileSync(path.join(dir, 'out.pptx')));
    assert.ok(zip.file('ppt/slides/slide1.xml'));
    assert.ok(zip.file('ppt/slides/slide2.xml'));
    const slide1 = await zip.file('ppt/slides/slide1.xml').async('string');
    assert.ok(slide1.includes('山田太郎'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('-o が無ければ fileNameFor の名前でカレントに書く', () => {
  const dir = tmp();
  try {
    writeFileSync(path.join(dir, 'in.json'), JSON.stringify(fixtures()[0].data));
    const r = run(['in.json'], dir);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout, 'B4_山田.pptx\n');
    assert.ok(existsSync(path.join(dir, 'B4_山田.pptx')));
    // 同名があれば上書きする
    assert.equal(run(['in.json'], dir).status, 0);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('名前が空だと終了コード 1', () => {
  const dir = tmp();
  try {
    writeFileSync(path.join(dir, 'in.json'), JSON.stringify({ ...fixtures()[0].data, name_ja_sei: '' }));
    const r = run(['in.json', '-o', 'out.pptx'], dir);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /name/);
    assert.equal(r.stdout, '');
    assert.ok(!existsSync(path.join(dir, 'out.pptx')));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('目標が5件だと終了コード 1、問題は全部出す', () => {
  const dir = tmp();
  try {
    const d = fixtures()[0].data;
    const goals = Array(5).fill({ goal: 'a', achievement: '', summary: '' });
    writeFileSync(path.join(dir, 'in.json'), JSON.stringify({ ...d, name_en: '', last_week: { ...d.last_week, goals } }));
    const r = run(['in.json', '-o', 'out.pptx'], dir);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /name_en/);
    assert.match(r.stderr, /last_week\.goals/);
    assert.ok(!existsSync(path.join(dir, 'out.pptx')));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('JSON が無い・壊れている・出力先フォルダが無いと終了コード 1', () => {
  const dir = tmp();
  try {
    assert.equal(run(['missing.json'], dir).status, 1);
    writeFileSync(path.join(dir, 'broken.json'), '{ not json');
    assert.equal(run(['broken.json'], dir).status, 1);
    writeFileSync(path.join(dir, 'in.json'), JSON.stringify(fixtures()[0].data));
    const r = run(['in.json', '-o', 'nodir/out.pptx'], dir);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /nodir/);
    assert.equal(run([], dir).status, 1);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('last_week が無い・オブジェクトでない JSON は入力エラーで終了コード 1', () => {
  const dir = tmp();
  try {
    const { last_week, ...noLast } = fixtures()[0].data;
    for (const data of [noLast, { ...noLast, last_week: 'x' }]) {
      writeFileSync(path.join(dir, 'in.json'), JSON.stringify(data));
      const r = run(['in.json', '-o', 'out.pptx'], dir);
      assert.equal(r.status, 1);
      assert.match(r.stderr, /入力エラー: last_week/);
      assert.doesNotMatch(r.stderr, /書き込みに失敗/);
      assert.equal(r.stdout, '');
      assert.ok(!existsSync(path.join(dir, 'out.pptx')));
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('hours が配列でない JSON は入力エラーで終了コード 1', () => {
  const dir = tmp();
  try {
    const d = fixtures()[0].data;
    writeFileSync(path.join(dir, 'in.json'), JSON.stringify({ ...d, this_week: { ...d.this_week, hours: 'x' } }));
    const r = run(['in.json', '-o', 'out.pptx'], dir);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /入力エラー: this_week\.hours/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
