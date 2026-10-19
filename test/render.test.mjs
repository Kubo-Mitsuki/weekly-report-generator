import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDeck } from '../slide.js';
import { buildDeckLegacy } from '../legacy/old_slide.mjs';
import { comparePptx } from '../tools/compare_pptx.mjs';
import { fixtures, render } from '../tools/test_helpers.mjs';

// コミット1の基準: 凍結版と新しい描画が、全ファイル一致する
for (const { name, data } of fixtures()) {
  test(`凍結版と同じ .pptx ができる: ${name}`, async () => {
    const legacy = await render(pptx => buildDeckLegacy(pptx, data));
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
