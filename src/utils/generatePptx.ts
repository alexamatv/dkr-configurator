import PptxGenJS from 'pptxgenjs';
import type { WizardState } from '@/types';
import { gatherDocData, makeFileName } from './gatherData';
import type { DocData, RobotBlock, TotalsBlock, PostRow } from './gatherData';
import { DKR_LOGO_BASE64 } from '@/fonts/dkr-logo';

// ─── Brand constants ───
const BLUE = '#1B75BB';
const DARK = '#1A1A2E';
const LIGHT_BG = '#F5F7FA';
const WHITE = '#FFFFFF';
const MUTED = '#6B7280';
const TABLE_HEADER_BG = '1B75BB';
const TABLE_ALT_BG = 'F0F4F8';

const fmt = (n: number) =>
  n === 0 ? 'В комплекте' : n.toLocaleString('ru-RU') + ' ₽';

function addSlideNumber(slide: PptxGenJS.Slide, num: number, total: number) {
  slide.addText(`${num} / ${total}`, {
    x: 8.5,
    y: 5.2,
    w: 1.2,
    h: 0.3,
    fontSize: 8,
    color: MUTED,
    align: 'right',
  });
}

function addLogo(slide: PptxGenJS.Slide) {
  slide.addImage({
    data: 'data:image/png;base64,' + DKR_LOGO_BASE64,
    x: 0.4,
    y: 0.2,
    w: 1.6,
    h: 0.45,
  });
}

// ─── Slide 1: Cover ───
function addCoverSlide(pptx: PptxGenJS, data: DocData) {
  const slide = pptx.addSlide();
  slide.background = { color: DARK };

  // Logo
  slide.addImage({
    data: 'data:image/png;base64,' + DKR_LOGO_BASE64,
    x: 3.3,
    y: 0.6,
    w: 3.4,
    h: 0.95,
  });

  slide.addText('Коммерческое предложение', {
    x: 0.5,
    y: 2.0,
    w: 9,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: WHITE,
    align: 'center',
  });

  slide.addText('Роботизированная мойка DG-Portal', {
    x: 0.5,
    y: 2.7,
    w: 9,
    h: 0.5,
    fontSize: 18,
    color: BLUE,
    align: 'center',
  });

  // Info block
  const infoLines = [
    `Клиент: ${data.header.client}`,
    `Менеджер: ${data.header.manager}`,
    `Дата: ${data.header.date}`,
    `Регион: ${data.header.region}`,
  ];
  slide.addText(infoLines.join('\n'), {
    x: 2.5,
    y: 3.6,
    w: 5,
    h: 1.2,
    fontSize: 12,
    color: '#CCCCCC',
    align: 'center',
    lineSpacingMultiple: 1.5,
  });
}

// ─── Slide 2: Pricing (robot model + BUR + options) ───
function addPricingSlide(pptx: PptxGenJS, robot: RobotBlock, totalSlides: number) {
  const slide = pptx.addSlide();
  slide.background = { color: WHITE };
  addLogo(slide);
  addSlideNumber(slide, 2, totalSlides);

  slide.addText('Стоимость оборудования', {
    x: 0.4,
    y: 0.8,
    w: 9,
    h: 0.5,
    fontSize: 22,
    bold: true,
    color: DARK,
  });

  // Build table rows
  const headerRow: PptxGenJS.TableRow = [
    { text: 'Наименование', options: { bold: true, color: WHITE, fill: { color: TABLE_HEADER_BG }, fontSize: 11, align: 'left' } },
    { text: 'Стоимость', options: { bold: true, color: WHITE, fill: { color: TABLE_HEADER_BG }, fontSize: 11, align: 'right' } },
  ];

  const rows: PptxGenJS.TableRow[] = [headerRow];

  // Robot model
  rows.push([
    { text: robot.modelName, options: { fontSize: 11, color: DARK } },
    { text: fmt(robot.modelPrice), options: { fontSize: 11, color: DARK, align: 'right' } },
  ]);

  // Included components
  if (robot.includedComponents.length > 0) {
    rows.push([
      { text: '  В комплекте: ' + robot.includedComponents.join(', '), options: { fontSize: 9, color: MUTED, colspan: 2 } },
    ]);
  }

  // BUR
  rows.push([
    { text: `БУР: ${robot.burName}`, options: { fontSize: 11, color: DARK } },
    { text: fmt(robot.burPrice), options: { fontSize: 11, color: DARK, align: 'right' } },
  ]);

  // Options
  robot.options.forEach((opt) => {
    rows.push([
      { text: opt.name, options: { fontSize: 11, color: DARK } },
      { text: fmt(opt.price), options: { fontSize: 11, color: DARK, align: 'right' } },
    ]);
  });

  // Subtotal
  rows.push([
    { text: 'Итого оборудование', options: { bold: true, fontSize: 12, color: DARK } },
    { text: fmt(robot.robotTotal), options: { bold: true, fontSize: 12, color: BLUE, align: 'right' } },
  ]);

  // Apply alternating row colors
  rows.forEach((row, idx) => {
    if (idx > 0 && idx % 2 === 0) {
      row.forEach((cell) => {
        if (typeof cell === 'object' && cell.options) {
          cell.options.fill = { color: TABLE_ALT_BG };
        }
      });
    }
  });

  slide.addTable(rows, {
    x: 0.4,
    y: 1.5,
    w: 9.2,
    colW: [6.5, 2.7],
    border: { type: 'solid', pt: 0.5, color: 'E0E0E0' },
    rowH: 0.4,
    margin: [4, 8, 4, 8],
  });
}

// ─── Slide 3: Extras (skip if empty) ───
function addExtrasSlide(pptx: PptxGenJS, extras: PostRow[], extrasTotal: number, slideNum: number, totalSlides: number) {
  const slide = pptx.addSlide();
  slide.background = { color: WHITE };
  addLogo(slide);
  addSlideNumber(slide, slideNum, totalSlides);

  slide.addText('Дополнительное оборудование', {
    x: 0.4,
    y: 0.8,
    w: 9,
    h: 0.5,
    fontSize: 22,
    bold: true,
    color: DARK,
  });

  const headerRow: PptxGenJS.TableRow = [
    { text: 'Наименование', options: { bold: true, color: WHITE, fill: { color: TABLE_HEADER_BG }, fontSize: 11, align: 'left' } },
    { text: 'Стоимость', options: { bold: true, color: WHITE, fill: { color: TABLE_HEADER_BG }, fontSize: 11, align: 'right' } },
  ];

  const rows: PptxGenJS.TableRow[] = [headerRow];

  extras.forEach((e) => {
    rows.push([
      { text: e.name, options: { fontSize: 11, color: DARK } },
      { text: fmt(e.price), options: { fontSize: 11, color: DARK, align: 'right' } },
    ]);
  });

  rows.push([
    { text: 'Итого доп. оборудование', options: { bold: true, fontSize: 12, color: DARK } },
    { text: fmt(extrasTotal), options: { bold: true, fontSize: 12, color: BLUE, align: 'right' } },
  ]);

  rows.forEach((row, idx) => {
    if (idx > 0 && idx % 2 === 0) {
      row.forEach((cell) => {
        if (typeof cell === 'object' && cell.options) {
          cell.options.fill = { color: TABLE_ALT_BG };
        }
      });
    }
  });

  slide.addTable(rows, {
    x: 0.4,
    y: 1.5,
    w: 9.2,
    colW: [6.5, 2.7],
    border: { type: 'solid', pt: 0.5, color: 'E0E0E0' },
    rowH: 0.4,
    margin: [4, 8, 4, 8],
  });
}

// ─── Slide 4: Totals ───
function addTotalsSlide(pptx: PptxGenJS, totals: TotalsBlock, slideNum: number, totalSlides: number) {
  const slide = pptx.addSlide();
  slide.background = { color: LIGHT_BG };
  addLogo(slide);
  addSlideNumber(slide, slideNum, totalSlides);

  slide.addText('Итого', {
    x: 0.4,
    y: 0.8,
    w: 9,
    h: 0.5,
    fontSize: 22,
    bold: true,
    color: DARK,
  });

  const rows: PptxGenJS.TableRow[] = [];

  rows.push([
    { text: 'Итого оборудование', options: { fontSize: 12, color: DARK } },
    { text: fmt(totals.subtotal), options: { fontSize: 12, color: DARK, align: 'right' } },
  ]);

  if (totals.discountPct > 0) {
    rows.push([
      { text: `Скидка ${totals.discountPct}%`, options: { fontSize: 12, color: DARK } },
      { text: `−${fmt(totals.discountAmount)}`, options: { fontSize: 12, color: '#DC2626', align: 'right' } },
    ]);
    rows.push([
      { text: 'После скидки', options: { fontSize: 12, color: DARK } },
      { text: fmt(totals.afterDiscount), options: { fontSize: 12, color: DARK, align: 'right' } },
    ]);
  }

  if (totals.montageAmount > 0) {
    rows.push([
      { text: totals.montageType, options: { fontSize: 12, color: DARK } },
      { text: fmt(totals.montageAmount), options: { fontSize: 12, color: DARK, align: 'right' } },
    ]);
  }

  if (totals.vatEnabled && totals.vatAmount > 0) {
    rows.push([
      { text: `НДС ${totals.vatPct}%`, options: { fontSize: 12, color: DARK } },
      { text: fmt(totals.vatAmount), options: { fontSize: 12, color: DARK, align: 'right' } },
    ]);
  }

  // Grand total
  rows.push([
    { text: 'ИТОГО К ОПЛАТЕ', options: { bold: true, fontSize: 14, color: WHITE, fill: { color: TABLE_HEADER_BG } } },
    { text: fmt(totals.total), options: { bold: true, fontSize: 14, color: WHITE, fill: { color: TABLE_HEADER_BG }, align: 'right' } },
  ]);

  slide.addTable(rows, {
    x: 1.5,
    y: 1.8,
    w: 7,
    colW: [4.2, 2.8],
    border: { type: 'solid', pt: 0.5, color: 'E0E0E0' },
    rowH: 0.5,
    margin: [6, 10, 6, 10],
  });
}

// ─── Main export ───
export async function generatePptx(state: WizardState) {
  const data = gatherDocData(state);
  const robot = data.robot;
  if (!robot) return;

  const hasExtras = robot.extras.length > 0;
  const totalSlides = hasExtras ? 4 : 3;

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'DKR Group';
  pptx.title = `КП — ${data.header.client}`;

  // Slide 1: Cover
  addCoverSlide(pptx, data);

  // Slide 2: Pricing
  addPricingSlide(pptx, robot, totalSlides);

  // Slide 3: Extras (conditional)
  let nextSlide = 3;
  if (hasExtras) {
    addExtrasSlide(pptx, robot.extras, robot.extrasTotal, nextSlide, totalSlides);
    nextSlide++;
  }

  // Slide 3/4: Totals
  addTotalsSlide(pptx, data.totals, nextSlide, totalSlides);

  const fileName = makeFileName(state, 'pptx');
  await pptx.writeFile({ fileName });
}
