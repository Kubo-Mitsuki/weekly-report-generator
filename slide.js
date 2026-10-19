// スライドの描画。DOM にも pptxgenjs にも触れない（pptx インスタンスは引数で受け取る）。
// 値は layout.js から読む。

import {
  SLIDE_LAYOUT, FONT, THEMES, OTHERS_THEME, HEADING,
  COLOR_BLACK, COLOR_WHITE,
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

// 達成度の表示。前後の空白を除いた値が半角の数字だけ（90・90.5）なら「90%」にする。それ以外はそのまま返す
// （スライドと画面の面の両方がこれを使う。保存するデータは変えない）
export function formatAchievement(v) {
  const s = v == null ? '' : String(v);
  const trimmed = s.trim();
  return /^\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}%` : s;
}

// 画面の警告: 在室時間（kind 'h'、0〜24）・達成度（kind 'a'、0〜100）のありえない値か。空は問題なし。
// 前後の空白を除き、達成度は末尾の % を1つ除いた値で判定する
const VALUE_RANGE = { h: 24, a: 100 };
export function isImplausible(kind, text) {
  let s = (text == null ? '' : String(text)).trim();
  if (s === '') return false;
  if (kind === 'a' && s.endsWith('%')) s = s.slice(0, -1);
  if (!/^\d+(\.\d+)?$/.test(s)) return true;
  return Number(s) > VALUE_RANGE[kind];
}

// 見出しの文字の書式（pptxgenjs の run の options）
const runFont = (h) => ({ fontSize: h.fontSize, ...(h.bold ? { bold: true } : {}), fontFace: FONT, color: h.color });

// 見出し。single があれば（旧の見た目。テスト専用）全体を1つの run にする。
// なければ、日本語の行（週の語 + 続く文字）と英語の行を別々のテキストボックスに置く。
// box: 見出しの枠、ja: { word?, rest }（その他の見出しは週の語なし）、en: 英語の行、wordColor: 週の語の色
function addHeading(slide, box, ja, en, wordColor, heading) {
  if (heading.single) {
    const label = `${ja.word || ''}${ja.rest}\n${en}`;
    slide.addText([{ text: label, options: runFont(heading.single) }], { ...box, valign: LABEL_VALIGN });
    return;
  }
  const H = heading;
  const plain = { margin: 0, valign: LABEL_VALIGN, fontFace: FONT };
  const runs = [];
  if (ja.word) runs.push({ text: ja.word, options: runFont({ ...H.word, color: wordColor }) });
  runs.push({ text: ja.rest, options: runFont(H.ja) });
  slide.addText(runs, { x: box.x, y: box.y, w: box.w, h: H.jaH, ...plain });
  slide.addText(en, {
    x: box.x, y: box.y + H.enY, w: box.w, h: H.enH, ...plain,
    fontSize: H.en.fontSize, bold: H.en.bold, color: H.en.color,
  });
}

// ── 1枚のスライド ──
// week: 'last' | 'this'（見出しの文字）、theme: その週の色の組 { accent, bandDark, bandLight }（THEMES.last / THEMES.this）
// opts（テスト専用。CLI と画面からは渡さない）: others 「その他」の色の組、heading 見出しの書式、percent false なら達成度に % を足さない
export function buildSlide(pptx, nameJa, nameEn, dateLabel, dates, sec, week, theme, opts = {}) {
  const othersTheme = opts.others || OTHERS_THEME;
  const heading = opts.heading || HEADING;
  const showAchievement = opts.percent === false ? (v) => v : formatAchievement;
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

  addHeading(slide, SLIDE_LABEL.box, TEXT.weekHeading[week], TEXT.weekHeading[week].en, theme.accent, heading);

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
      { text: showAchievement(g.achievement || ''), options: { fontSize: gt.fontSize, align: CELL.align, valign: CELL.valign, fill: { color: band } } },
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

  addHeading(slide, OTHERS_LABEL.box, { rest: TEXT.othersHeading.ja }, TEXT.othersHeading.en, null, heading);

  const ot = OTHERS_TABLE;
  const otherRows = [
    [{ text: TEXT.summaryHeader, options: { bold: CELL.headerBold, fill: { color: othersTheme.accent }, color: COLOR_WHITE, fontSize: ot.fontSize, align: CELL.align, valign: CELL.valign } }]
  ];
  for (let i = 0; i < ROWS.others; i++) {
    const o = (sec.others && sec.others[i]) || {};
    const band = i % 2 === 0 ? othersTheme.bandDark : othersTheme.bandLight;
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
// opts.themes / opts.others / opts.heading / opts.percent は layout.js の値などを差し替えるためのもの
// （テスト専用。CLI と画面からは渡さない）
export function buildDeck(pptx, data, opts = {}) {
  const themes = opts.themes || THEMES;
  const base = parseDate(data.date);
  const nameJa = data.name_ja_sei + data.name_ja_mei;
  const dateLabel = fmtMD(base);
  const lastDates = weekDates(base, true);
  const thisDates = weekDates(base, false);

  pptx.layout = SLIDE_LAYOUT;

  buildSlide(pptx, nameJa, data.name_en, dateLabel, lastDates, data.last_week, 'last', themes.last, opts);
  buildSlide(pptx, nameJa, data.name_en, dateLabel, thisDates, data.this_week, 'this', themes.this, opts);
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
