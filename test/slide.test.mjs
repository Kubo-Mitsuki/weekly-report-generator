import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate, fileNameFor } from '../slide.js';
import { fixtures } from '../tools/test_helpers.mjs';

test('フィクスチャはすべて検査を通る', () => {
  for (const { name, data } of fixtures()) {
    assert.deepEqual(validate(data), [], name);
  }
});

test('validate: 名前・ローマ字・日付', () => {
  const data = { ...fixtures()[0].data, name_ja_sei: '', name_en: '', date: 'abc' };
  assert.deepEqual(validate(data).map(p => p.field), ['name', 'name_en', 'date']);
});

test('validate: 件数の上限', () => {
  const base = fixtures()[0].data;
  const data = {
    ...base,
    last_week: { hours: Array(8).fill(''), goals: Array(5).fill({ goal: 'a' }), others: Array(5).fill({ summary: 'a' }) },
    this_week: { hours: Array(8).fill(''), goals: Array(5).fill({ goal: 'a' }), others: Array(5).fill({ summary: 'a' }) },
  };
  const fields = validate(data).map(p => p.field).sort();
  assert.deepEqual(fields, [
    'last_week.goals', 'last_week.hours', 'last_week.others',
    'this_week.goals', 'this_week.hours', 'this_week.others',
  ]);
  for (const p of validate(data)) assert.ok(p.message);
});

test('validate: 上限ちょうどは通る', () => {
  const base = fixtures()[0].data;
  const sec = { hours: Array(7).fill(''), goals: Array(4).fill({ goal: 'a' }), others: Array(4).fill({ summary: 'a' }) };
  assert.deepEqual(validate({ ...base, last_week: sec, this_week: sec }), []);
});

test('fileNameFor', () => {
  const d = { grade: 'B4', name_ja_sei: '山田', name_ja_mei: '太郎', fn_format: 'sei' };
  assert.equal(fileNameFor(d), 'B4_山田');
  assert.equal(fileNameFor({ ...d, fn_format: 'sei_mei' }), 'B4_山田_太郎');
  assert.equal(fileNameFor({ ...d, grade: '' }), '山田');
  assert.equal(fileNameFor({ ...d, grade: '​ B4 ﻿', name_ja_sei: '山 田/x' }), 'B4_山_田_x');
});
