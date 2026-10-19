import { test } from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { buildDeck, weekDates } from '../slide.js';
import { THEMES, HEADING } from '../layout.js';
import { buildSlide as buildSlideLegacy, parseDate, fmtMD } from '../legacy/old_slide.mjs';
import { comparePptx } from '../tools/compare_pptx.mjs';
import { fixtures, render } from '../tools/test_helpers.mjs';

// 旧の見た目: 両週とも青の組、見出しは1つのまとまりで18pt・灰・細字
const LEGACY_OPTS = {
  themes: { last: { ...THEMES.last }, this: { ...THEMES.last } },
  heading: { single: { fontSize: 18, bold: false, color: '333333' } },
};

// 凍結版の buildSlide に新しい weekDates の結果を渡して作った .pptx と、
// 旧の値（LEGACY_OPTS）を渡した新しい buildDeck の .pptx が全ファイル一致する
// （= 日付・色・見出し以外は何も変わっていない）
function buildDeckWithLegacySlide(pptx, data) {
  const base = parseDate(data.date);
  const nameJa = data.name_ja_sei + data.name_ja_mei;
  const dateLabel = fmtMD(base);
  pptx.layout = 'LAYOUT_WIDE';
  buildSlideLegacy(pptx, nameJa, data.name_en, dateLabel, weekDates(base, true), data.last_week,
    '先週の目標とその進捗\nLast week\'s goals and progress',
    'その他取り組むこと\nWhat else I will do');
  buildSlideLegacy(pptx, nameJa, data.name_en, dateLabel, weekDates(base, false), data.this_week,
    '今週の目標とその進捗\nThis week\'s goals and progress',
    'その他取り組むこと\nWhat else I will do');
}

for (const { name, data } of fixtures()) {
  test(`凍結版の buildSlide と同じ .pptx ができる（日付は新しい weekDates）: ${name}`, async () => {
    const legacy = await render(pptx => buildDeckWithLegacySlide(pptx, data));
    const current = await render(pptx => buildDeck(pptx, data, LEGACY_OPTS));
    assert.deepEqual(await comparePptx(legacy, current), []);
  });
}

const BLUE = ['156082', 'D0DCE5', 'E8EEF2'];
const ORANGE = ['C55A11', 'F4B183', 'FBE5D6'];
const GREEN = ['196B24', 'D1DFD3', 'E8EFE9'];

async function slideXml(data, n) {
  const zip = await JSZip.loadAsync(await render(pptx => buildDeck(pptx, data)));
  return zip.file(`ppt/slides/slide${n}.xml`).async('string');
}

// <a:tbl> ごとの塗り色
function fillsByTable(xml) {
  return xml.match(/<a:tbl>[\s\S]*?<\/a:tbl>/g).map(t => new Set([...t.matchAll(/<a:tcPr[^>]*>[\s\S]*?<\/a:tcPr>/g)]
    .flatMap(m => [...m[0].matchAll(/<a:solidFill><a:srgbClr val="([0-9A-F]{6})"/g)].map(f => f[1]))));
}

test('今週のスライドは橙、先週は青、その他の表は2枚とも緑', async () => {
  const data = fixtures()[1].data;
  const [last, thisWeek] = [await slideXml(data, 1), await slideXml(data, 2)];
  for (const [xml, [accent, dark, light]] of [[last, BLUE], [thisWeek, ORANGE]]) {
    const [att, goals, others] = fillsByTable(xml);
    assert.ok(att.has(accent));
    assert.ok(goals.has(accent) && goals.has(dark) && goals.has(light));
    for (const c of [...BLUE, ...ORANGE]) if (![accent, dark, light].includes(c)) {
      assert.ok(!att.has(c) && !goals.has(c), `${c} が混ざっている`);
    }
    assert.ok(GREEN.every(c => others.has(c)));
    assert.ok(![...BLUE, ...ORANGE].some(c => others.has(c)));
  }
});

test('目標の表の上の見出しは日本語の行と英語の行の別々の run', async () => {
  const xml = await slideXml(fixtures()[1].data, 2);
  const runs = [...xml.matchAll(/<a:r><a:rPr([^>]*)>(<a:solidFill><a:srgbClr val="([0-9A-F]{6})"\/>)(?:(?!<\/a:r>)[\s\S])*?<a:t>([^<]*)<\/a:t>/g)]
    .filter(m => m[4].includes('今週の目標') || m[4].includes('goals and progress'));
  assert.equal(runs.length, 2);
  const [ja, en] = runs;
  assert.match(ja[1], /sz="2600"/); assert.match(ja[1], /b="1"/); assert.equal(ja[3], HEADING.ja.color);
  assert.match(en[1], /sz="1600"/); assert.doesNotMatch(en[1], /b="1"/); assert.equal(en[3], HEADING.en.color);
  // 「その他取り組むこと」の見出しは変わらない（18pt・灰・1つの run）
  const others = [...xml.matchAll(/<a:rPr([^>]*)>(?:(?!<\/a:r>)[\s\S])*?<a:t>(その他取り組むこと|What else I will do)<\/a:t>/g)];
  assert.equal(others.length, 2);
  for (const m of others) assert.match(m[1], /sz="1800"/);
});

test('compare_pptx は内容の違いを検出する', async () => {
  const [a, b] = fixtures();
  const x = await render(pptx => buildDeck(pptx, a.data));
  const y = await render(pptx => buildDeck(pptx, b.data));
  const diffs = await comparePptx(x, y);
  assert.ok(diffs.length > 0);
});
