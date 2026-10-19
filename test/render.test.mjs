import { test } from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { buildDeck, weekDates } from '../slide.js';
import { THEMES, OTHERS_THEME, HEADING, SLIDE_LABEL, OTHERS_LABEL, TEXT } from '../layout.js';
import { buildSlide as buildSlideLegacy, parseDate, fmtMD } from '../legacy/old_slide.mjs';
import { comparePptx } from '../tools/compare_pptx.mjs';
import { fixtures, render } from '../tools/test_helpers.mjs';

// 旧の見た目: 両週とも旧の青、その他も旧の緑、見出しは1つのまとまりで18pt・灰・細字（札なし）、達成度に % を足さない
const OLD_BLUE = { accent: '156082', bandDark: 'D0DCE5', bandLight: 'E8EEF2' };
const OLD_GREEN = { accent: '196B24', bandDark: 'D1DFD3', bandLight: 'E8EFE9' };
const LEGACY_OPTS = {
  themes: { last: { ...OLD_BLUE }, this: { ...OLD_BLUE } },
  others: { ...OLD_GREEN },
  heading: { single: { fontSize: 18, bold: false, color: '333333' } },
  percent: false,
};

// 凍結版の buildSlide に新しい weekDates の結果を渡して作った .pptx と、
// 旧の値（LEGACY_OPTS）を渡した新しい buildDeck の .pptx が全ファイル一致する
// （= 日付・色・見出し・% 以外は何も変わっていない）
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

const BLUE = ['2C6194', 'D4E1EF', 'EBF1F7'];
const ORANGE = ['C57539', 'F0DBCD', 'F8EEE8'];
const GREEN = ['3D6D48', 'D7E3D9', 'ECF2ED'];

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

const EMU = 914400;
const emu = (inch) => Math.round(inch * EMU);

const unescapeXml = (t) => t.replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

// スライドの中の <p:sp>（テキストボックス・図形）を文字ごとに引く
function shapes(xml) {
  return xml.match(/<p:sp>[\s\S]*?<\/p:sp>/g).map(sp => ({
    xml: sp,
    text: [...sp.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(m => unescapeXml(m[1])).join('|'),
    off: sp.match(/<a:off x="(\d+)" y="(\d+)"\/>/)?.slice(1).map(Number),
    ext: sp.match(/<a:ext cx="(\d+)" cy="(\d+)"\/>/)?.slice(1).map(Number),
    fill: sp.match(/<p:spPr>(?:(?!<\/p:spPr>)[\s\S])*?<a:solidFill><a:srgbClr val="([0-9A-F]{6})"/)?.[1],
    rPr: sp.match(/<a:rPr([^>]*)>(?:<a:solidFill><a:srgbClr val="([0-9A-F]{6})"\/>)?/),
  }));
}
const find = (list, text) => list.find(s => s.text === text);

test('見出しの札: 週の色の四角の上に白の太字20ptで「先週」「今週」', async () => {
  for (const [n, week, badge, accent] of [[1, 'last', '先週', THEMES.last.accent], [2, 'this', '今週', THEMES.this.accent]]) {
    const list = shapes(await slideXml(fixtures()[1].data, n));
    const b = find(list, badge);
    assert.ok(b, `${badge} の札がある`);
    assert.equal(b.fill, accent);
    assert.match(b.rPr[1], /sz="2000"/); assert.match(b.rPr[1], /b="1"/); assert.equal(b.rPr[2], 'FFFFFF');
    // 枠 SLIDE_LABEL.box の左上にそろう
    assert.deepEqual(b.off, [emu(SLIDE_LABEL.box.x), emu(SLIDE_LABEL.box.y)]);
    assert.deepEqual(b.ext, [emu(HEADING.badge.w), emu(HEADING.badge.h)]);
    // 札のすぐ右に「の目標とその進捗」18pt・細字・黒
    const rest = find(list, TEXT.weekHeading[week].rest);
    assert.ok(rest);
    assert.match(rest.rPr[1], /sz="1800"/); assert.doesNotMatch(rest.rPr[1], /b="1"/); assert.equal(rest.rPr[2], '000000');
    assert.equal(rest.off[0], emu(SLIDE_LABEL.box.x + HEADING.badge.w + HEADING.gap));
    assert.equal(rest.off[1], b.off[1]);
    assert.equal(rest.fill, undefined);
    // 札の下の行に英語。16pt・細字・灰で、札にしない
    const en = find(list, TEXT.weekHeading[week].en);
    assert.ok(en);
    assert.match(en.rPr[1], /sz="1600"/); assert.doesNotMatch(en.rPr[1], /b="1"/); assert.equal(en.rPr[2], '333333');
    assert.equal(en.fill, undefined);
    assert.equal(en.off[0], b.off[0]);
    assert.ok(en.off[1] >= b.off[1] + b.ext[1]);
    // 強調表示（highlight）は使わない
    assert.ok(!list.some(s => s.xml.includes('<a:highlight')));
  }
});

test('「その他取り組むこと」の見出しは目標の見出しと同じ段（日本語18pt・黒、英語16pt・灰、札なし）', async () => {
  const list = shapes(await slideXml(fixtures()[1].data, 2));
  const rest = find(list, TEXT.weekHeading.this.rest);
  const en = find(list, TEXT.weekHeading.this.en);
  const ja2 = find(list, TEXT.othersHeading.ja);
  const en2 = find(list, TEXT.othersHeading.en);
  assert.ok(ja2 && en2);
  assert.match(ja2.rPr[1], /sz="1800"/); assert.doesNotMatch(ja2.rPr[1], /b="1"/); assert.equal(ja2.rPr[2], '000000');
  assert.match(en2.rPr[1], /sz="1600"/); assert.doesNotMatch(en2.rPr[1], /b="1"/); assert.equal(en2.rPr[2], '333333');
  assert.equal(ja2.fill, undefined); assert.equal(en2.fill, undefined);
  assert.equal(ja2.off[0], emu(OTHERS_LABEL.box.x));
  assert.equal(ja2.off[1], rest.off[1]); assert.deepEqual(ja2.ext.slice(1), rest.ext.slice(1));
  assert.equal(en2.off[1], en.off[1]); assert.deepEqual(en2.ext.slice(1), en.ext.slice(1));
});

test('達成度は数字だけのときスライドに % が付く（それ以外はそのまま）', async () => {
  assert.equal(OTHERS_THEME.accent, GREEN[0]);
  const data = structuredClone(fixtures()[1].data);
  const ach = ['90', ' 90.5 ', '90%', '約90'];
  data.this_week.goals = ach.map((a, i) => ({ goal: `g${i}`, achievement: a, summary: '' }));
  const xml = await slideXml(data, 2);
  const texts = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(m => m[1]);
  for (const want of ['90%', '90.5%', '約90']) assert.ok(texts.includes(want), want);
  assert.equal(texts.filter(t => t === '90%').length, 2); // '90' → 90%、'90%' はそのまま
  assert.ok(!texts.includes('90%%') && !texts.includes('約90%'));
  // JSON（保存するデータ）は変えない
  assert.equal(data.this_week.goals[0].achievement, '90');
});

test('compare_pptx は内容の違いを検出する', async () => {
  const [a, b] = fixtures();
  const x = await render(pptx => buildDeck(pptx, a.data));
  const y = await render(pptx => buildDeck(pptx, b.data));
  const diffs = await comparePptx(x, y);
  assert.ok(diffs.length > 0);
});
