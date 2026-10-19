import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDeck, weekDates } from '../slide.js';
import { buildSlide as buildSlideLegacy, parseDate, fmtMD } from '../legacy/old_slide.mjs';
import { comparePptx } from '../tools/compare_pptx.mjs';
import { fixtures, render } from '../tools/test_helpers.mjs';

// 凍結版の buildSlide に新しい weekDates の結果を渡して作った .pptx と、
// 新しい buildDeck の .pptx が全ファイル一致する（= 日付以外は何も変わっていない）
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
    const current = await render(pptx => buildDeck(pptx, data));
    assert.deepEqual(await comparePptx(legacy, current), []);
  });
}

test('compare_pptx は内容の違いを検出する', async () => {
  const [a, b] = fixtures();
  const x = await render(pptx => buildDeck(pptx, a.data));
  const y = await render(pptx => buildDeck(pptx, b.data));
  const diffs = await comparePptx(x, y);
  assert.ok(diffs.length > 0);
});
