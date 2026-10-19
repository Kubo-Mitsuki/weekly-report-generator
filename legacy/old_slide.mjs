// 凍結版: コミット dc9a62d の index.html から写した比較の基準。直さないこと。
// 変更は export を足したことと、buildDeckLegacy で包んだことだけ。

const FONT = 'Yu Gothic';
const ACCENT1 = '156082';
const ACCENT3 = '196B24';
const BAND_BLUE_DARK = 'D0DCE5';
const BAND_BLUE_LIGHT = 'E8EEF2';
const BAND_GREEN_DARK = 'D1DFD3';
const BAND_GREEN_LIGHT = 'E8EFE9';

export function parseDate(s) {
  const parts = s.replace(/-/g, '/').split('/');
  if (parts.length !== 3) return null;
  const d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
  return isNaN(d.getTime()) ? null : d;
}

export function fmtMD(d) {
  return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}

export function weekDates(base, before) {
  const dates = [];
  for (let i = before ? -7 : 1; i <= (before ? -1 : 7); i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    dates.push(fmtMD(d));
  }
  return dates;
}

export function buildSlide(pptx, nameJa, nameEn, dateLabel, dates, sec, slideLabel, othersLabel) {
  const slide = pptx.addSlide();

  slide.addText(dateLabel, {
    x: 0.30, y: 0.21, w: 1.01, h: 0.44,
    fontSize: 20, bold: true, fontFace: FONT, color: '000000'
  });

  slide.addText([
    { text: nameJa, options: { fontSize: 20, bold: true, fontFace: FONT, breakLine: true } },
    { text: nameEn, options: { fontSize: 20, bold: true, fontFace: FONT } }
  ], { x: 0.28, y: 0.53, w: 2.86, h: 0.87, color: '000000' });

  const attRows = [
    [{ text: 'Date', options: { bold: true, fontSize: 18, fill: { color: ACCENT1 }, color: 'FFFFFF', align: 'center', valign: 'middle' } }],
    [{ text: '在室時間', options: { bold: true, fontSize: 18, fill: { color: ACCENT1 }, color: 'FFFFFF', align: 'center', valign: 'middle' } }]
  ];
  for (let i = 0; i < 7; i++) {
    attRows[0].push({ text: dates[i] || '', options: { fontSize: 18, align: 'center', valign: 'middle' } });
    attRows[1].push({ text: (sec.hours[i] || ''), options: { fontSize: 18, align: 'center', valign: 'middle' } });
  }
  slide.addTable(attRows, {
    x: 3.28, y: 0.28, w: 9.76,
    fontFace: FONT, color: '000000',
    border: { type: 'solid', pt: 0.5, color: '999999' },
    colW: [1.22, 1.22, 1.22, 1.22, 1.22, 1.22, 1.22, 1.22],
    rowH: [0.38, 0.38], autoPage: false
  });

  slide.addText([
    { text: slideLabel, options: { fontSize: 18, fontFace: FONT, color: '333333' } }
  ], { x: 0.28, y: 1.47, w: 8.96, h: 0.82, valign: 'middle' });

  const goalRows = [
    [
      { text: '目標', options: { bold: true, fill: { color: ACCENT1 }, color: 'FFFFFF', fontSize: 18, align: 'center', valign: 'middle' } },
      { text: '達成度', options: { bold: true, fill: { color: ACCENT1 }, color: 'FFFFFF', fontSize: 18, align: 'center', valign: 'middle' } },
      { text: '概要', options: { bold: true, fill: { color: ACCENT1 }, color: 'FFFFFF', fontSize: 18, align: 'center', valign: 'middle' } }
    ]
  ];
  for (let i = 0; i < 4; i++) {
    const g = (sec.goals && sec.goals[i]) || {};
    const band = i % 2 === 0 ? BAND_BLUE_DARK : BAND_BLUE_LIGHT;
    goalRows.push([
      { text: g.goal || '', options: { fontSize: 18, fill: { color: band }, valign: 'middle' } },
      { text: g.achievement || '', options: { fontSize: 18, align: 'center', valign: 'middle', fill: { color: band } } },
      { text: g.summary || '', options: { fontSize: 18, fill: { color: band }, valign: 'middle' } }
    ]);
  }
  slide.addTable(goalRows, {
    x: 0.28, y: 2.28, w: 8.96,
    fontFace: FONT, color: '000000',
    border: { type: 'solid', pt: 0.5, color: '999999' },
    colW: [2.99, 1.21, 4.76],
    rowH: [0.35, 1.15, 1.15, 1.15, 1.15], autoPage: false
  });

  slide.addText([
    { text: othersLabel, options: { fontSize: 18, fontFace: FONT, color: '333333' } }
  ], { x: 9.53, y: 1.47, w: 3.51, h: 0.82, valign: 'middle' });

  const otherRows = [
    [{ text: '概要', options: { bold: true, fill: { color: ACCENT3 }, color: 'FFFFFF', fontSize: 18, align: 'center', valign: 'middle' } }]
  ];
  for (let i = 0; i < 4; i++) {
    const o = (sec.others && sec.others[i]) || {};
    const band = i % 2 === 0 ? BAND_GREEN_DARK : BAND_GREEN_LIGHT;
    otherRows.push([
      { text: o.summary || '', options: { fontSize: 18, fill: { color: band }, valign: 'middle' } }
    ]);
  }
  slide.addTable(otherRows, {
    x: 9.52, y: 2.28, w: 3.54,
    fontFace: FONT, color: '000000',
    border: { type: 'solid', pt: 0.5, color: '999999' },
    colW: [3.54],
    rowH: [0.35, 1.15, 1.15, 1.15, 1.15], autoPage: false
  });
}

export function buildDeckLegacy(pptx, data) {
  const base = parseDate(data.date); // generate() 890行目（検査側）の定義。包むために必要
  const nameJa = data.name_ja_sei + data.name_ja_mei;
  const dateLabel = fmtMD(base);
  const lastDates = weekDates(base, true);
  const thisDates = weekDates(base, false);

  pptx.layout = 'LAYOUT_WIDE';

  buildSlide(pptx, nameJa, data.name_en, dateLabel, lastDates, data.last_week,
    '先週の目標とその進捗\nLast week\'s goals and progress',
    'その他取り組むこと\nWhat else I will do');
  buildSlide(pptx, nameJa, data.name_en, dateLabel, thisDates, data.this_week,
    '今週の目標とその進捗\nThis week\'s goals and progress',
    'その他取り組むこと\nWhat else I will do');
}
