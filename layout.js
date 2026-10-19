// スライドのレイアウト値と固定文字列。座標・寸法の単位はインチ（LAYOUT_WIDE = 13.33 x 7.5）。
// 描画ロジックは slide.js にあり、ここには値だけを置く。

export const SLIDE_LAYOUT = 'LAYOUT_WIDE';

// ── 書体・色 ──
export const FONT = 'Yu Gothic';

// 3色（青・橙・緑）は OKLCH で明るさと鮮やかさをそろえた組。白い文字との比は 青6.5・橙3.5・緑6.0。
// accent は見出しの「先週」「今週」の文字・在室時間の表と目標の表の見出し、bandDark / bandLight は表の縞（濃・淡）。
// 先週は青、今週は橙。「その他」の表は週によらず緑（OTHERS_THEME）。
export const THEMES = {
  last: { accent: '2C6194', bandDark: 'D4E1EF', bandLight: 'EBF1F7' },
  this: { accent: 'C57539', bandDark: 'F0DBCD', bandLight: 'F8EEE8' },
};
export const OTHERS_THEME = { accent: '3D6D48', bandDark: 'D7E3D9', bandLight: 'ECF2ED' };

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
  // 目標の表の上の見出し。word は週の色で塗る語、rest はそれに続く文字、en は下の英語の行
  weekHeading: {
    last: { word: '先週', rest: 'の目標とその進捗', en: 'Last week\'s goals and progress' },
    this: { word: '今週', rest: 'の目標とその進捗', en: 'This week\'s goals and progress' },
  },
  othersHeading: { ja: 'その他取り組むこと', en: 'What else I will do' },
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

// 見出し（「先週／今週の目標とその進捗」）の枠
export const SLIDE_LABEL = {
  box: { x: 0.28, y: 1.47, w: 8.96, h: 0.82 },
};

// 見出しの文字。日本語の行（週の語 + 続く文字）の高さは jaH、英語の行はその下
export const HEADING = {
  word: { fontSize: 20, bold: true },                       // 「先週」「今週」。色は週の色（THEMES.*.accent）
  ja: { fontSize: 18, bold: false, color: COLOR_BLACK },    // 週の語に続く文字・その他の見出しの日本語の行
  en: { fontSize: 16, bold: false, color: COLOR_LABEL },    // 英語の行
  jaH: 0.40,      // 日本語の行の高さ
  enY: 0.42,      // 枠の上端から英語の行の上端まで
  enH: 0.30,      // 英語の行の高さ
};

// 目標の表
export const GOALS_TABLE = {
  box: { x: 0.28, y: 2.28, w: 8.96 },
  colW: [2.99, 1.21, 4.76],
  rowH: [0.35, 1.15, 1.15, 1.15, 1.15],
  fontSize: 18,
};

// 「その他取り組むこと」の見出し。文字の段は目標の見出しと同じ（HEADING）
export const OTHERS_LABEL = {
  box: { x: 9.53, y: 1.47, w: 3.51, h: 0.82 },
};

// その他の表
export const OTHERS_TABLE = {
  box: { x: 9.52, y: 2.28, w: 3.54 },
  colW: [3.54],
  rowH: [0.35, 1.15, 1.15, 1.15, 1.15],
  fontSize: 18,
};
