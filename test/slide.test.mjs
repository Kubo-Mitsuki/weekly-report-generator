import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate, validateImport, fileNameFor, formatAchievement } from '../slide.js';
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

test('validate: 形の検査（出力・CLI）', () => {
  const base = fixtures()[0].data;
  const { last_week, ...noLast } = base;
  assert.deepEqual(validate(noLast).map(p => p.field), ['last_week']);
  const { this_week, ...noThis } = base;
  assert.deepEqual(validate(noThis).map(p => p.field), ['this_week']);
  assert.deepEqual(validate({ ...base, last_week: null }).map(p => p.field), ['last_week']);
  assert.deepEqual(validate({ ...base, this_week: [] }).map(p => p.field), ['this_week']);
  assert.deepEqual(validate({ ...base, last_week: { ...last_week, goals: 'x' } }).map(p => p.field), ['last_week.goals']);
  assert.deepEqual(validate({ ...base, this_week: { ...this_week, hours: {} } }).map(p => p.field), ['this_week.hours']);
  assert.deepEqual(validate({ ...base, last_week: { ...last_week, others: null } }).map(p => p.field), ['last_week.others']);
  for (const bad of [null, [], 'x', 3]) assert.equal(validate(bad).length, 1);
});

test('validateImport: 拒否するもの', () => {
  const base = fixtures()[0].data;
  for (const bad of [null, [], 'x', 3]) assert.equal(validateImport(bad).length, 1);
  assert.deepEqual(validateImport({ ...base, last_week: 'x' }).map(p => p.field), ['last_week']);
  assert.deepEqual(validateImport({ ...base, this_week: null }).map(p => p.field), ['this_week']);
  assert.deepEqual(validateImport({ ...base, this_week: { hours: 'x' } }).map(p => p.field), ['this_week.hours']);
  assert.deepEqual(validateImport({ ...base, last_week: { goals: {} } }).map(p => p.field), ['last_week.goals']);
  assert.deepEqual(validateImport({ ...base, last_week: { others: null } }).map(p => p.field), ['last_week.others']);
  const over = { hours: Array(8).fill(''), goals: Array(5).fill({}), others: Array(5).fill({}) };
  assert.deepEqual(validateImport({ ...base, last_week: over }).map(p => p.field).sort(),
    ['last_week.goals', 'last_week.hours', 'last_week.others']);
});

test('validateImport: 読み込んでよいもの（入力の途中）', () => {
  const base = fixtures()[0].data;
  assert.deepEqual(validateImport({}), []);
  assert.deepEqual(validateImport({ ...base, name_ja_sei: '', name_ja_mei: '', name_en: '', date: '' }), []);
  const { date, name_en, ...partial } = base;
  assert.deepEqual(validateImport(partial), []);
  const { last_week, this_week, ...noWeeks } = base;
  assert.deepEqual(validateImport(noWeeks), []);
  assert.deepEqual(validateImport({ ...base, last_week: {} }), []);
  // 出力の検査は通らない（名前・日付・週が無い）
  assert.ok(validate(noWeeks).length > 0);
  for (const { name, data } of fixtures()) assert.deepEqual(validateImport(data), [], name);
});

test('formatAchievement: 数字だけのときは % を付け、それ以外はそのまま', () => {
  for (const [v, want] of [['90', '90%'], ['90.5', '90.5%'], [' 90 ', '90%'], ['0', '0%'], ['120', '120%']]) {
    assert.equal(formatAchievement(v), want, JSON.stringify(v));
  }
  for (const v of ['90%', '約90', '', ' ', '９０', '.5', '90.', '1e2', '-1', undefined, null]) {
    assert.equal(formatAchievement(v), v == null ? '' : v, JSON.stringify(v));
  }
});
