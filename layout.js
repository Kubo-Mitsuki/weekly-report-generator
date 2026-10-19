// スライドのレイアウト値と固定文字列。座標・寸法の単位はインチ（LAYOUT_WIDE = 13.33 x 7.5）。
// 描画ロジックは slide.js にあり、ここには値だけを置く。

export const SLIDE_LAYOUT = 'LAYOUT_WIDE';

// ── 書体・色 ──
export const FONT = 'Yu Gothic';
export const ACCENT3 = '196B24';
export const BAND_GREEN_DARK = 'D1DFD3';
export const BAND_GREEN_LIGHT = 'E8EFE9';

// 週ごとの色。accent は在室時間の表の見出しと目標の表の見出し、bandDark / bandLight は目標の表の縞。
// 先週は青、今週は橙。「その他」の表は週によらず緑（ACCENT3・BAND_GREEN_*）。
export const THEMES = {
  last: { accent: '156082', bandDark: 'D0DCE5', bandLight: 'E8EEF2' },
  this: { accent: 'C55A11', bandDark: 'F4B183', bandLight: 'FBE5D6' },
};

export const COLOR_BLACK = '000000';
export const COLOR_WHITE = 'FFFFFF';
export const COLOR_LABEL = '333333';

export const BORDER = { type: 'solid', pt: 0.5, color: '999999' };

// 表のセルの共通設定
export const CELL = {
  headerBold: true,      // 見出しセルは太字
  align: 'center',       // 見出し・Date・在室時間・達成度の水平位置
  valign: 'middle',      // 全セルの垂直位置
};
export const AUTO_PAGE = false;

// 見出し（スライド内のテキストボックス）の垂直位置
export const LABEL_VALIGN = 'middle';

// ── 行数 ──
export const ROWS = {
  days: 7,    // 在室時間の日数
  goals: 4,   // 目標の行数
  others: 4,  // その他の行数
};

// ── 固定の文字列 ──
export const TEXT = {
  lastWeekLabel: '先週の目標とその進捗\nLast week\'s goals and progress',
  thisWeekLabel: '今週の目標とその進捗\nThis week\'s goals and progress',
  othersLabel: 'その他取り組むこと\nWhat else I will do',
  dateHeader: 'Date',
  hoursHeader: '在室時間',
  goalHeader: '目標',
  achievementHeader: '達成度',
  summaryHeader: '概要',
};

// ── 各要素 ──

// 基準日（MM/DD）
export const DATE_LABEL = {
  box: { x: 0.30, y: 0.21, w: 1.01, h: 0.44 },
  fontSize: 20,
  bold: true,
};

// 氏名（日本語・ローマ字の2行）
export const NAME_BOX = {
  box: { x: 0.28, y: 0.53, w: 2.86, h: 0.87 },
  fontSize: 20,
  bold: true,
};

// 在室時間の表（Date 行と 在室時間 行）
export const ATTENDANCE_TABLE = {
  box: { x: 3.28, y: 0.28, w: 9.76 },
  colW: [1.22, 1.22, 1.22, 1.22, 1.22, 1.22, 1.22, 1.22],
  rowH: [0.38, 0.38],
  fontSize: 18,
};

// 「先週／今週の目標とその進捗」の見出し
export const SLIDE_LABEL = {
  box: { x: 0.28, y: 1.47, w: 8.96, h: 0.82 },
};

// その見出しの文字（日本語の行と英語の行を別々の run にする）
export const HEADING = {
  ja: { fontSize: 26, bold: true, color: '000000' },
  en: { fontSize: 16, bold: false, color: '333333' },
};

// 目標の表
export const GOALS_TABLE = {
  box: { x: 0.28, y: 2.28, w: 8.96 },
  colW: [2.99, 1.21, 4.76],
  rowH: [0.35, 1.15, 1.15, 1.15, 1.15],
  fontSize: 18,
};

// 「その他取り組むこと」の見出し
export const OTHERS_LABEL = {
  box: { x: 9.53, y: 1.47, w: 3.51, h: 0.82 },
  fontSize: 18,
};

// その他の表
export const OTHERS_TABLE = {
  box: { x: 9.52, y: 2.28, w: 3.54 },
  colW: [3.54],
  rowH: [0.35, 1.15, 1.15, 1.15, 1.15],
  fontSize: 18,
};
