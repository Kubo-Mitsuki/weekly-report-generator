// スライドの描画。DOM にも pptxgenjs にも触れない（pptx インスタンスは引数で受け取る）。
// 値は layout.js から読む。

import {
  SLIDE_LAYOUT, FONT, ACCENT3, THEMES, HEADING,
  BAND_GREEN_DARK, BAND_GREEN_LIGHT,
  COLOR_BLACK, COLOR_WHITE, COLOR_LABEL,
  BORDER, CELL, AUTO_PAGE, LABEL_VALIGN, ROWS, TEXT,
  DATE_LABEL, NAME_BOX, ATTENDANCE_TABLE, SLIDE_LABEL,
  GOALS_TABLE, OTHERS_LABEL, OTHERS_TABLE,
} from './layout.js';

// ── Date helpers ──
export function parseDate(s) {
  const parts = s.replace(/-/g, '/').split('/');
  if (parts.length !== 3) return null;
  const d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
  return isNaN(d.getTime()) ? null : d;
}

export function fmtDate(d) {
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}

export function fmtMD(d) {
  return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}

// 今週 = 基準日〜6日後、先週 = 基準日の7日前〜前日（MM/DD の配列）
export function weekDates(base, before) {
  const dates = [];
  for (let i = before ? -7 : 0; i <= (before ? -1 : 6); i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    dates.push(fmtMD(d));
  }
  return dates;
}

// 「日本語\nEnglish」の見出しを [日本語の行, 英語の行] に分ける
export function splitLabel(label) {
  const i = label.indexOf('\n');
  return i < 0 ? [label, ''] : [label.slice(0, i), label.slice(i + 1)];
}

// 目標の表の上の見出しの run。heading が { single } なら1つの run、{ ja, en } なら行ごとの run
function headingRuns(label, heading) {
  const font = (h) => ({ fontSize: h.fontSize, ...(h.bold ? { bold: true } : {}), fontFace: FONT, color: h.color });
  if (heading.single) return [{ text: label, options: font(heading.single) }];
  const [ja, en] = splitLabel(label);
  return [
    { text: ja, options: { ...font(heading.ja), breakLine: true } },
    { text: en, options: font(heading.en) },
  ];
}

// ── 1枚のスライド ──
// theme: その週の色の組 { accent, bandDark, bandLight }（THEMES.last / THEMES.this）
// heading: 見出しの文字（既定 HEADING）。テスト用に差し替えられる
export function buildSlide(pptx, nameJa, nameEn, dateLabel, dates, sec, slideLabel, othersLabel, theme, heading = HEADING) {
  const slide = pptx.addSlide();

  slide.addText(dateLabel, {
    ...DATE_LABEL.box,
    fontSize: DATE_LABEL.fontSize, bold: DATE_LABEL.bold, fontFace: FONT, color: COLOR_BLACK
  });

  slide.addText([
    { text: nameJa, options: { fontSize: NAME_BOX.fontSize, bold: NAME_BOX.bold, fontFace: FONT, breakLine: true } },
    { text: nameEn, options: { fontSize: NAME_BOX.fontSize, bold: NAME_BOX.bold, fontFace: FONT } }
  ], { ...NAME_BOX.box, color: COLOR_BLACK });

  const att = ATTENDANCE_TABLE;
  const attHead = { bold: CELL.headerBold, fontSize: att.fontSize, fill: { color: theme.accent }, color: COLOR_WHITE, align: CELL.align, valign: CELL.valign };
  const attRows = [
    [{ text: TEXT.dateHeader, options: { ...attHead } }],
    [{ text: TEXT.hoursHeader, options: { ...attHead } }]
  ];
  for (let i = 0; i < ROWS.days; i++) {
    attRows[0].push({ text: dates[i] || '', options: { fontSize: att.fontSize, align: CELL.align, valign: CELL.valign } });
    attRows[1].push({ text: ((sec.hours && sec.hours[i]) || ''), options: { fontSize: att.fontSize, align: CELL.align, valign: CELL.valign } });
  }
  slide.addTable(attRows, {
    ...att.box,
    fontFace: FONT, color: COLOR_BLACK,
    border: { ...BORDER },
    colW: [...att.colW],
    rowH: [...att.rowH], autoPage: AUTO_PAGE
  });

  slide.addText(headingRuns(slideLabel, heading), { ...SLIDE_LABEL.box, valign: LABEL_VALIGN });

  const gt = GOALS_TABLE;
  const goalHead = { bold: CELL.headerBold, fill: { color: theme.accent }, color: COLOR_WHITE, fontSize: gt.fontSize, align: CELL.align, valign: CELL.valign };
  const goalRows = [
    [
      { text: TEXT.goalHeader, options: { ...goalHead, fill: { color: theme.accent } } },
      { text: TEXT.achievementHeader, options: { ...goalHead, fill: { color: theme.accent } } },
      { text: TEXT.summaryHeader, options: { ...goalHead, fill: { color: theme.accent } } }
    ]
  ];
  for (let i = 0; i < ROWS.goals; i++) {
    const g = (sec.goals && sec.goals[i]) || {};
    const band = i % 2 === 0 ? theme.bandDark : theme.bandLight;
    goalRows.push([
      { text: g.goal || '', options: { fontSize: gt.fontSize, fill: { color: band }, valign: CELL.valign } },
      { text: g.achievement || '', options: { fontSize: gt.fontSize, align: CELL.align, valign: CELL.valign, fill: { color: band } } },
      { text: g.summary || '', options: { fontSize: gt.fontSize, fill: { color: band }, valign: CELL.valign } }
    ]);
  }
  slide.addTable(goalRows, {
    ...gt.box,
    fontFace: FONT, color: COLOR_BLACK,
    border: { ...BORDER },
    colW: [...gt.colW],
    rowH: [...gt.rowH], autoPage: AUTO_PAGE
  });

  slide.addText([
    { text: othersLabel, options: { fontSize: OTHERS_LABEL.fontSize, fontFace: FONT, color: COLOR_LABEL } }
  ], { ...OTHERS_LABEL.box, valign: LABEL_VALIGN });

  const ot = OTHERS_TABLE;
  const otherRows = [
    [{ text: TEXT.summaryHeader, options: { bold: CELL.headerBold, fill: { color: ACCENT3 }, color: COLOR_WHITE, fontSize: ot.fontSize, align: CELL.align, valign: CELL.valign } }]
  ];
  for (let i = 0; i < ROWS.others; i++) {
    const o = (sec.others && sec.others[i]) || {};
    const band = i % 2 === 0 ? BAND_GREEN_DARK : BAND_GREEN_LIGHT;
    otherRows.push([
      { text: o.summary || '', options: { fontSize: ot.fontSize, fill: { color: band }, valign: CELL.valign } }
    ]);
  }
  slide.addTable(otherRows, {
    ...ot.box,
    fontFace: FONT, color: COLOR_BLACK,
    border: { ...BORDER },
    colW: [...ot.colW],
    rowH: [...ot.rowH], autoPage: AUTO_PAGE
  });
}

// ── 2枚（先週・今週）のスライド ──
// opts.themes / opts.heading は layout.js の値を差し替えるためのもの（テスト専用。CLI と画面からは渡さない）
export function buildDeck(pptx, data, opts = {}) {
  const themes = opts.themes || THEMES;
  const heading = opts.heading || HEADING;
  const base = parseDate(data.date);
  const nameJa = data.name_ja_sei + data.name_ja_mei;
  const dateLabel = fmtMD(base);
  const lastDates = weekDates(base, true);
  const thisDates = weekDates(base, false);

  pptx.layout = SLIDE_LAYOUT;

  buildSlide(pptx, nameJa, data.name_en, dateLabel, lastDates, data.last_week,
    TEXT.lastWeekLabel, TEXT.othersLabel, themes.last, heading);
  buildSlide(pptx, nameJa, data.name_en, dateLabel, thisDates, data.this_week,
    TEXT.thisWeekLabel, TEXT.othersLabel, themes.this, heading);
}

// ── ファイル名（拡張子なし） ──
export function fileNameFor(data) {
  // U+200B-200D (ZW spaces), U+FEFF (BOM) など不可視文字を除去
  const stripInvisible = s => (s || '').replace(/[​-‍﻿]/g, '').trim();
  const seiClean = stripInvisible(data.name_ja_sei);
  const meiClean = stripInvisible(data.name_ja_mei);
  const gradeClean = stripInvisible(data.grade);
  const parts = [];
  if (gradeClean) parts.push(gradeClean);
  if (seiClean) parts.push(seiClean);
  if (data.fn_format === 'sei_mei' && meiClean) parts.push(meiClean);
  return parts.join('_')
    .replace(/[\\/:*?"<>|\s]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// ── 入力検査 ──
// どちらも問題の配列 [{ field, message }] を返す。問題が無ければ空配列。

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// 形の検査（出力・読み込みで共通）。requireWeeks: last_week・this_week が無いのも問題にする
function shapeProblems(data, requireWeeks) {
  if (!isObject(data)) return [{ field: '(全体)', message: 'JSON全体がオブジェクトではありません' }];
  const problems = [];
  const weeks = ['last_week', 'this_week'];
  const sections = {};
  for (const week of weeks) {
    if (data[week] === undefined) {
      if (requireWeeks) problems.push({ field: week, message: `${week} がありません` });
    } else if (!isObject(data[week])) {
      problems.push({ field: week, message: `${week} はオブジェクトである必要があります` });
    } else {
      sections[week] = data[week];
    }
  }
  const limits = [['goals', ROWS.goals, '目標は{n}件までです'], ['others', ROWS.others, 'その他は{n}件までです'], ['hours', ROWS.days, '在室時間は{n}日分までです']];
  for (const [key, max, msg] of limits) {
    for (const week of weeks) {
      const list = sections[week] && sections[week][key];
      if (list === undefined) continue;
      if (!Array.isArray(list)) problems.push({ field: `${week}.${key}`, message: `${week}.${key} は配列である必要があります` });
      else if (list.length > max) problems.push({ field: `${week}.${key}`, message: msg.replace('{n}', max) });
    }
  }
  return problems;
}

// 出力（画面の「出力」と CLI）の検査
export function validate(data) {
  if (!isObject(data)) return shapeProblems(data, true);
  const problems = [];
  if (!data.name_ja_sei) problems.push({ field: 'name', message: '苗字を入力してください' });
  if (!data.name_en) problems.push({ field: 'name_en', message: 'ローマ字の氏名を入力してください' });
  if (typeof data.date !== 'string' || !parseDate(data.date)) {
    problems.push({ field: 'date', message: '日付を YYYY/MM/DD の形で入力してください' });
  }
  return problems.concat(shapeProblems(data, true));
}

// JSON 読み込み（画面）の検査。入力の途中を渡すことがあるので、名前・日付が空でも、週が無くてもよい
export function validateImport(data) {
  return shapeProblems(data, false);
}
