import ExcelJS from 'exceljs';
import type { WizardState } from '@/types';
import type { DataContextValue } from '@/context/DataContext';
import { gatherDocData, makeFileName, type PostRow, type PostBlock } from './gatherData';
import type { KpPhotoEmbed } from './generatePdf';

/* ─── Post grouping (shared with PDF) ─── */
interface PostGroup { post: PostBlock; count: number; }

function groupPosts(posts: PostBlock[]): PostGroup[] {
  const groups: PostGroup[] = [];
  for (const post of posts) {
    const key = postFingerprint(post);
    const existing = groups.find((g) => postFingerprint(g.post) === key);
    if (existing) existing.count++;
    else groups.push({ post, count: 1 });
  }
  return groups;
}

function postFingerprint(p: PostBlock): string {
  return [
    p.profileName, p.basePrice, p.bumName, p.bumPrice,
    p.payments.map((r) => r.name + ':' + r.price).join('|'),
    p.accessories.map((r) => r.name + ':' + r.price).join('|'),
    p.functions.map((r) => r.name + ':' + r.price).join('|'),
    p.pumps.map((r) => r.name + ':' + r.price).join('|'),
    p.postExtras.map((r) => r.name + ':' + r.price).join('|'),
    p.secondPump ? p.secondPump.name + ':' + p.secondPump.price : '',
    p.postVacuum ? p.postVacuum.name + ':' + p.postVacuum.price : '',
  ].join('//');
}

// ─── Palette (ARGB without alpha prefix — ExcelJS adds FF) ───
const DARK = '1E293B';
const BLUE = '0EA5E9';
const LABEL_GRAY = '6B7280';
const TEXT_DARK = '111827';
const SUBHEAD = '374151';
const HEAD_BG = 'F1F5F9';
const LINE_LIGHT = 'E2E8F0';
const FOOTER_GRAY = '9CA3AF';
const FONT = 'Arial';

export async function generateXlsx(
  state: WizardState,
  data: DataContextValue,
  photos: KpPhotoEmbed[] = [],
): Promise<void> {
  const d = gatherDocData(state, data);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('КП', {
    properties: { defaultColWidth: 10 },
    pageSetup: {
      orientation: 'portrait',
      margins: { left: 0.79, right: 0.79, top: 0.79, bottom: 0.79, header: 0.3, footer: 0.3 },
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  // Column widths: A=8, B=55, C=18
  ws.getColumn(1).width = 8;
  ws.getColumn(2).width = 55;
  ws.getColumn(3).width = 18;

  // ─── Style presets ───
  const dkrFont: Partial<ExcelJS.Font> = { bold: true, size: 14, name: FONT, color: { argb: BLUE } };
  const titleFont: Partial<ExcelJS.Font> = { bold: true, size: 12, name: FONT, color: { argb: DARK } };
  const subtitleFont: Partial<ExcelJS.Font> = { size: 10, name: FONT, color: { argb: LABEL_GRAY } };
  const dateFont: Partial<ExcelJS.Font> = { size: 9, name: FONT, color: { argb: LABEL_GRAY } };
  const sectionFont: Partial<ExcelJS.Font> = { bold: true, size: 11, name: FONT, color: { argb: DARK } };
  const labelFont: Partial<ExcelJS.Font> = { size: 10, name: FONT, color: { argb: LABEL_GRAY } };
  const valueFont: Partial<ExcelJS.Font> = { bold: true, size: 10, name: FONT, color: { argb: TEXT_DARK } };
  const subheadFont: Partial<ExcelJS.Font> = { bold: true, size: 10, name: FONT, color: { argb: SUBHEAD } };
  const dataFont: Partial<ExcelJS.Font> = { size: 10, name: FONT, color: { argb: SUBHEAD } };
  const priceFont: Partial<ExcelJS.Font> = { size: 10, name: FONT, color: { argb: TEXT_DARK } };
  const subtotalFont: Partial<ExcelJS.Font> = { bold: true, size: 11, name: FONT, color: { argb: BLUE } };
  const grandLabelFont: Partial<ExcelJS.Font> = { bold: true, size: 14, name: FONT, color: { argb: DARK } };
  const grandValueFont: Partial<ExcelJS.Font> = { bold: true, size: 14, name: FONT, color: { argb: BLUE } };
  const pctFont: Partial<ExcelJS.Font> = { bold: true, size: 10, name: FONT, color: { argb: BLUE } };
  const footerFont: Partial<ExcelJS.Font> = { italic: true, size: 8, name: FONT, color: { argb: FOOTER_GRAY } };
  const priceFormat = '#,##0" \u20BD"';

  const thinBorder: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: DARK } };
  const blueBorder: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: BLUE } };
  const lightBorder: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: LINE_LIGHT } };
  const headFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEAD_BG } };
  const blueMedBorder: Partial<ExcelJS.Border> = { style: 'medium', color: { argb: BLUE } };
  const darkMedBorder: Partial<ExcelJS.Border> = { style: 'medium', color: { argb: DARK } };

  let rowNum = 0;

  // ─── Row helpers ───

  function nextRow(): ExcelJS.Row {
    rowNum++;
    return ws.getRow(rowNum);
  }

  function addSpacer() {
    nextRow();
  }

  // ─── Section header: merged A:C, bold 11pt, thin bottom border ───
  function addSectionRow(text: string) {
    addSpacer();
    const row = nextRow();
    ws.mergeCells(rowNum, 1, rowNum, 3);
    row.getCell(1).value = text;
    row.getCell(1).font = sectionFont;
    row.getCell(1).border = { bottom: thinBorder };
    row.height = 22;
  }

  // ─── Info row: label gray, value bold, no borders ───
  function addInfoRow(label: string, value: string | number) {
    const row = nextRow();
    row.getCell(1).value = label;
    row.getCell(1).font = labelFont;
    row.getCell(2).value = value;
    row.getCell(2).font = valueFont;
  }

  // ─── Table header row: gray fill, bold, thin borders ───
  function addBlockHeader(heading: string) {
    const row = nextRow();
    row.getCell(2).value = heading;
    row.getCell(2).font = subheadFont;
    row.getCell(3).value = 'Стоимость';
    row.getCell(3).font = subheadFont;
    row.getCell(3).alignment = { horizontal: 'right' };
    // Gray fill on B and C
    row.getCell(1).fill = headFill;
    row.getCell(2).fill = headFill;
    row.getCell(3).fill = headFill;
    row.getCell(1).border = { bottom: lightBorder, top: lightBorder };
    row.getCell(2).border = { bottom: lightBorder, top: lightBorder };
    row.getCell(3).border = { bottom: lightBorder, top: lightBorder };
  }

  // ─── Data row: name in B, price in C, thin #E2E8F0 bottom border. Returns row number. ───
  function addPriceRow(name: string, price: number): number {
    const row = nextRow();
    row.getCell(2).value = name;
    row.getCell(2).font = dataFont;
    // 0 → "В комплекте", 0 < price ≤ 1 → placeholder ("Цена по запросу"),
    // anything else → numeric with the standard currency format.
    if (price === 0) {
      row.getCell(3).value = 'В комплекте';
    } else if (price > 0 && price <= 1) {
      row.getCell(3).value = 'Цена по запросу';
    } else {
      row.getCell(3).value = price;
      row.getCell(3).numFmt = priceFormat;
    }
    row.getCell(3).font = priceFont;
    row.getCell(3).alignment = { horizontal: 'right' };
    row.getCell(1).border = { bottom: lightBorder };
    row.getCell(2).border = { bottom: lightBorder };
    row.getCell(3).border = { bottom: lightBorder };
    return rowNum;
  }

  // ─── Labeled price row (for totals): label in A, price in C ───
  function addLabeledPriceRow(label: string, name: string, price: number): number {
    const row = nextRow();
    row.getCell(1).value = label;
    row.getCell(1).font = labelFont;
    if (name) {
      row.getCell(2).value = name;
      row.getCell(2).font = dataFont;
    }
    row.getCell(3).value = price;
    row.getCell(3).font = priceFont;
    row.getCell(3).numFmt = priceFormat;
    row.getCell(3).alignment = { horizontal: 'right' };
    row.getCell(1).border = { bottom: lightBorder };
    row.getCell(2).border = { bottom: lightBorder };
    row.getCell(3).border = { bottom: lightBorder };
    return rowNum;
  }

  // ─── Price block: sub-header + items. Returns tracked rows. ───
  function addPriceBlock(heading: string, items: PostRow[]): number[] {
    if (items.length === 0) return [];
    addBlockHeader(heading);
    return items.map((r) => addPriceRow(r.name, r.price));
  }

  // ─── Subtotal: merged A:B, blue text, top border ───
  function addFormulaSubtotal(label: string, trackedRows: number[], fallback: number): number {
    const row = nextRow();
    ws.mergeCells(rowNum, 1, rowNum, 2);
    row.getCell(1).value = label;
    row.getCell(1).font = subtotalFont;
    row.getCell(1).border = { top: lightBorder };
    if (trackedRows.length > 0) {
      row.getCell(3).value = { formula: sumOf(trackedRows), result: fallback };
    } else {
      row.getCell(3).value = 0;
    }
    row.getCell(3).font = subtotalFont;
    row.getCell(3).numFmt = priceFormat;
    row.getCell(3).alignment = { horizontal: 'right' };
    row.getCell(3).border = { top: lightBorder };
    return rowNum;
  }

  // ─── Formula row: label in A, formula in C ───
  function addFormulaRow(label: string, formula: string, fallback: number, font: Partial<ExcelJS.Font> = priceFont): number {
    const row = nextRow();
    row.getCell(1).value = label;
    row.getCell(1).font = labelFont;
    row.getCell(3).value = { formula, result: fallback };
    row.getCell(3).font = font;
    row.getCell(3).numFmt = priceFormat;
    row.getCell(3).alignment = { horizontal: 'right' };
    row.getCell(1).border = { bottom: lightBorder };
    row.getCell(2).border = { bottom: lightBorder };
    row.getCell(3).border = { bottom: lightBorder };
    return rowNum;
  }

  // ─── Editable % in B, C left for formula ───
  function addPctRow(label: string, pctValue: number): number {
    const row = nextRow();
    row.getCell(1).value = label;
    row.getCell(1).font = labelFont;
    row.getCell(2).value = pctValue;
    row.getCell(2).font = pctFont;
    row.getCell(2).numFmt = '#0"%"';
    row.getCell(3).font = priceFont;
    row.getCell(3).numFmt = priceFormat;
    row.getCell(3).alignment = { horizontal: 'right' };
    row.getCell(1).border = { bottom: lightBorder };
    row.getCell(2).border = { bottom: lightBorder };
    row.getCell(3).border = { bottom: lightBorder };
    return rowNum;
  }

  function setFormula(r: number, formula: string, fallback: number) {
    ws.getRow(r).getCell(3).value = { formula, result: fallback };
  }

  // ─── Included items list ───
  const includedFont: Partial<ExcelJS.Font> = { size: 9, name: FONT, color: { argb: LABEL_GRAY } };
  const includedBoldFont: Partial<ExcelJS.Font> = { bold: true, size: 9, name: FONT, color: { argb: LABEL_GRAY } };

  function addIncludedItems(items: string[]) {
    if (items.length === 0) return;
    const row = nextRow();
    row.getCell(2).value = '\u0427\u0442\u043E \u0432\u0445\u043E\u0434\u0438\u0442 \u0432 \u043A\u043E\u043C\u043F\u043B\u0435\u043A\u0442:';
    row.getCell(2).font = includedBoldFont;
    for (const item of items) {
      const r = nextRow();
      r.getCell(2).value = '\u2022  ' + item;
      r.getCell(2).font = includedFont;
    }
  }

  // ─── Formula helpers ───
  function sumOf(rows: number[]): string {
    if (rows.length === 0) return '0';
    if (rows.length === 1) return `C${rows[0]}`;
    return 'SUM(' + rows.map((r) => `C${r}`).join(',') + ')';
  }
  function cellC(r: number): string { return `C${r}`; }
  function cellB(r: number): string { return `B${r}`; }

  // ═══════════════════════════════════════
  // HEADER (rows 1-5)
  // ═══════════════════════════════════════

  // Row 1: merge A1:C1, "DKR GROUP"
  const row1 = nextRow();
  ws.mergeCells(1, 1, 1, 3);
  row1.getCell(1).value = 'DKR GROUP';
  row1.getCell(1).font = dkrFont;
  row1.height = 24;

  // Row 2: merge A2:C2, "КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ"
  const row2 = nextRow();
  ws.mergeCells(2, 1, 2, 3);
  row2.getCell(1).value = '\u041A\u041E\u041C\u041C\u0415\u0420\u0427\u0415\u0421\u041A\u041E\u0415 \u041F\u0420\u0415\u0414\u041B\u041E\u0416\u0415\u041D\u0418\u0415';
  row2.getCell(1).font = titleFont;
  row2.height = 20;

  // Row 3: merge A3:C3, subtitle (object type)
  const objectLabel = d.isTruck ? 'Грузовая мойка' : d.isRobot ? 'Роботизированная мойка' : 'Мойка самообслуживания';
  const row3 = nextRow();
  ws.mergeCells(3, 1, 3, 3);
  row3.getCell(1).value = objectLabel;
  row3.getCell(1).font = subtitleFont;

  // Row 4: merge A4:C4, date
  const row4 = nextRow();
  ws.mergeCells(4, 1, 4, 3);
  row4.getCell(1).value = d.header.date;
  row4.getCell(1).font = dateFont;

  // Row 5: spacer
  addSpacer();

  // Info rows (6-11)
  addInfoRow('Менеджер', d.header.manager);
  addInfoRow('Клиент', d.header.client);
  addInfoRow('Тип транспорта', d.header.vehicleType);
  addInfoRow('Тип объекта', d.header.objectType);
  addInfoRow('Регион доставки', d.header.region);

  // ─── Tracked subtotal rows for equipment formula ───
  const equipmentSubtotalRows: number[] = [];

  // ─── TRUCK, ROBOT, or POSTS ───
  if (d.isTruck && d.truck) {
    addSectionRow('Грузовая мойка');
    const priceRows: number[] = [];

    priceRows.push(addPriceRow(d.truck.typeName, d.truck.typePrice));
    addIncludedItems(d.truck.includedItems);
    if (d.truck.burPrice > 0) {
      priceRows.push(addPriceRow(`БУР: ${d.truck.burName}`, d.truck.burPrice));
    }
    priceRows.push(...addPriceBlock('Опции', d.truck.options));

    if (d.truck.manualPost.length > 0) {
      priceRows.push(...addPriceBlock('Ручной пост', d.truck.manualPost));
      if (d.truck.manualPostMontage > 0) {
        priceRows.push(addPriceRow('Монтаж ручного поста', d.truck.manualPostMontage));
      }
    }
    if (d.truck.waterPrice > 0) {
      priceRows.push(addPriceRow(`Водоочистка: ${d.truck.waterLabel}`, d.truck.waterPrice));
    }

    equipmentSubtotalRows.push(addFormulaSubtotal('Итого грузовая мойка', priceRows, d.truck.truckTotal));

  } else if (d.isRobot && d.robot) {
    addSectionRow('Робот');
    const priceRows: number[] = [];

    priceRows.push(addPriceRow(d.robot.modelName, d.robot.modelPrice));
    addIncludedItems(d.robot.includedComponents);
    priceRows.push(addPriceRow(`БУР: ${d.robot.burName}`, d.robot.burPrice));
    priceRows.push(...addPriceBlock('Опции робота', d.robot.options));
    if (d.robot.subOptions && d.robot.subOptions.length > 0) {
      priceRows.push(...addPriceBlock('Опции терминала', d.robot.subOptions));
    }
    if (d.robot.extras && d.robot.extras.length > 0) {
      priceRows.push(...addPriceBlock('Доп. оборудование', d.robot.extras));
    }

    equipmentSubtotalRows.push(addFormulaSubtotal('Итого робот', priceRows, d.robot.robotTotal));

  } else {
    const groups = groupPosts(d.posts);

    groups.forEach((group) => {
      const { post, count } = group;
      const title = count > 1
        ? `\u041F\u043E\u0441\u0442 \u2014 ${post.profileName} (\u00D7${count})`
        : (groups.length === 1 ? `\u041F\u043E\u0441\u0442 \u2014 ${post.profileName}` : post.title);

      addSectionRow(title);
      addInfoRow('\u041F\u0440\u043E\u0444\u0438\u043B\u044C', post.profileName);
      const priceRows: number[] = [];

      priceRows.push(addPriceRow(`\u0411\u0430\u0437\u043E\u0432\u0430\u044F \u043A\u043E\u043C\u043F\u043B\u0435\u043A\u0442\u0430\u0446\u0438\u044F (${post.profileName})`, post.basePrice));
      if (post.bumSwapped) {
        priceRows.push(addPriceRow(`Замена терминала: ${post.defaultBumName} → ${post.bumName}`, post.bumPrice));
      }
      addIncludedItems(post.includedItems);

      priceRows.push(...addPriceBlock('\u0421\u0438\u0441\u0442\u0435\u043C\u044B \u043E\u043F\u043B\u0430\u0442\u044B', post.payments));
      priceRows.push(...addPriceBlock('\u0410\u043A\u0441\u0435\u0441\u0441\u0443\u0430\u0440\u044B', post.accessories));

      if (post.baseFunctions.length > 0) {
        priceRows.push(...addPriceBlock('\u0411\u0430\u0437\u043E\u0432\u044B\u0435 \u0444\u0443\u043D\u043A\u0446\u0438\u0438 (\u0432 \u043A\u043E\u043C\u043F\u043B\u0435\u043A\u0442\u0435)', post.baseFunctions));
      }
      priceRows.push(...addPriceBlock('\u0424\u0443\u043D\u043A\u0446\u0438\u0438 \u043C\u043E\u0439\u043A\u0438', post.functions));
      priceRows.push(...addPriceBlock('\u0410\u0412\u0414 (\u043F\u043E\u043C\u043F\u044B)', post.pumps));

      const extrasWithPump = [...post.postExtras];
      if (post.secondPump) extrasWithPump.push(post.secondPump);
      if (post.postVacuum) extrasWithPump.push(post.postVacuum);
      priceRows.push(...addPriceBlock('\u0414\u043E\u043F. \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435 \u043A \u043F\u043E\u0441\u0442\u0443', extrasWithPump));

      const perPostSubtotalRow = addFormulaSubtotal('\u0421\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C 1 \u043F\u043E\u0441\u0442\u0430', priceRows, post.postTotal);

      if (count > 1) {
        const groupRow = addFormulaRow(
          `\u0421\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C ${count} \u043F\u043E\u0441\u0442\u043E\u0432`,
          `${cellC(perPostSubtotalRow)}*${count}`,
          post.postTotal * count,
          subtotalFont,
        );
        equipmentSubtotalRows.push(groupRow);
      } else {
        equipmentSubtotalRows.push(perPostSubtotalRow);
      }
    });
  }

  // ─── WASH BLOCK ───
  if (!d.isTruck) {
    addSectionRow('Оборудование на мойку');
    const washRows: number[] = [];

    if (d.wash.waterRows.length > 0) {
      washRows.push(...addPriceBlock('Водоподготовка', d.wash.waterRows));
    }

    if (d.wash.vacuumPrice > 0) {
      washRows.push(addPriceRow(`Пылесосы: ${d.wash.vacuumLabel}`, d.wash.vacuumPrice));
    }

    if (d.wash.extras.length > 0) {
      washRows.push(...addPriceBlock('Доп. оборудование мойки', d.wash.extras));
    }

    if (d.wash.pipelines.air > 0 || d.wash.pipelines.water > 0 || d.wash.pipelines.chem > 0) {
      const pipRows: PostRow[] = [];
      if (d.wash.pipelines.air > 0) pipRows.push({ name: 'Воздушные', price: d.wash.pipelines.air });
      if (d.wash.pipelines.water > 0) pipRows.push({ name: 'Водные', price: d.wash.pipelines.water });
      if (d.wash.pipelines.chem > 0) pipRows.push({ name: 'Химические', price: d.wash.pipelines.chem });
      washRows.push(...addPriceBlock('Магистрали', pipRows));
    }

    equipmentSubtotalRows.push(addFormulaSubtotal('Итого на мойку', washRows, d.wash.washTotal));
  }

  // ═══════════════════════════════════════
  // TOTALS — all formulas
  // ═══════════════════════════════════════
  addSectionRow('Итоговый расчёт');

  // Итого оборудование = SUM of section subtotals
  const equipRow = addFormulaSubtotal('Итого оборудование', equipmentSubtotalRows, d.totals.subtotal);

  // Скидка: editable % in B, formula in C
  const discountRow = addPctRow('Скидка, %', d.totals.discountPct);
  setFormula(discountRow, `${cellC(equipRow)}*${cellB(discountRow)}/100`, d.totals.discountAmount);
  if (d.totals.discountWarning) {
    ws.getRow(discountRow).getCell(2).note = '\u26A0 Скидка больше 3% — требуется согласование';
  }

  // После скидки = оборудование - скидка
  const afterDiscRow = addFormulaRow(
    'После скидки',
    `${cellC(equipRow)}-${cellC(discountRow)}`,
    d.totals.afterDiscount,
    valueFont,
  );

  // Монтаж: editable % or fixed for КОМПАК
  const isKompakTruck = d.isTruck && d.truck && d.totals.montageType.includes('фикс');
  let montageRow: number;
  if (isKompakTruck) {
    montageRow = addLabeledPriceRow(`Монтаж (${d.totals.montageType})`, '', d.totals.montageFromSubtotal);
  } else {
    const montagePct = d.totals.montageAmount > 0
      ? (d.totals.montageType.includes('10') ? 10 : d.totals.montageType.includes('5') ? 5 : 0)
      : 0;
    montageRow = addPctRow('Монтаж, %', montagePct);
    // Montage from subtotal BEFORE discount
    setFormula(montageRow, `${cellC(equipRow)}*${cellB(montageRow)}/100`, d.totals.montageFromSubtotal);
  }

  // Доп. работы: editable number
  let montageExtraRow: number | null = null;
  if (d.totals.montageExtra > 0 || d.totals.montageAmount > 0) {
    montageExtraRow = addLabeledPriceRow('Доп. работы по монтажу', '', d.totals.montageExtra);
  }

  // НДС: editable % in B, formula in C
  const vatPct = d.totals.vatEnabled ? d.totals.vatPct : 0;
  const vatBaseFormula = montageExtraRow
    ? `(${cellC(afterDiscRow)}+${cellC(montageRow)}+${cellC(montageExtraRow)})`
    : `(${cellC(afterDiscRow)}+${cellC(montageRow)})`;

  const vatRow = addPctRow('НДС, %', vatPct);
  setFormula(vatRow, `${vatBaseFormula}*${cellB(vatRow)}/100`, d.totals.vatAmount);
  if (!d.totals.vatEnabled) {
    ws.getRow(vatRow).getCell(1).note = 'Участник Сколково — НДС 0%. Измените % при необходимости.';
  }

  addSpacer();

  // ─── ИТОГО: medium blue border top, bold text, medium blue border bottom ───
  const topBorderRow = nextRow();
  topBorderRow.getCell(1).border = { bottom: blueMedBorder };
  topBorderRow.getCell(2).border = { bottom: blueMedBorder };
  topBorderRow.getCell(3).border = { bottom: blueMedBorder };

  const grandParts = [cellC(afterDiscRow), cellC(montageRow), cellC(vatRow)];
  if (montageExtraRow) grandParts.splice(2, 0, cellC(montageExtraRow));
  const grandFormula = grandParts.join('+');

  const grandRow = nextRow();
  ws.mergeCells(rowNum, 1, rowNum, 2);
  grandRow.getCell(1).value = 'ИТОГО';
  grandRow.getCell(1).font = grandLabelFont;
  grandRow.getCell(3).value = { formula: grandFormula, result: d.totals.total };
  grandRow.getCell(3).font = grandValueFont;
  grandRow.getCell(3).numFmt = priceFormat;
  grandRow.getCell(3).alignment = { horizontal: 'right' };
  grandRow.height = 28;
  grandRow.getCell(1).border = { bottom: blueMedBorder };
  grandRow.getCell(3).border = { bottom: blueMedBorder };

  // ─── CONDITIONS ───
  addSectionRow('Условия');
  addInfoRow('Условия доставки', d.deliveryConditions);
  addInfoRow('Условия оплаты', d.paymentConditions);

  // ─── EQUIPMENT PHOTOS (optional appendix) ───
  if (photos.length > 0) {
    addSpacer();
    addSectionRow('Фото оборудования');

    // Uniform display box for every photo. We compute draw width/height
    // per-image to preserve the source aspect ratio so wide and tall
    // photos all sit centred inside the same box.
    const BOX_W = 120;
    const BOX_H = 90;

    for (const p of photos) {
      const labelRow = nextRow();
      labelRow.getCell(1).value = p.label;
      labelRow.getCell(1).font = valueFont;
      ws.mergeCells(rowNum, 1, rowNum, 2);
      labelRow.getCell(3).value = p.price;
      labelRow.getCell(3).numFmt = priceFormat;
      labelRow.getCell(3).font = valueFont;
      labelRow.getCell(3).alignment = { horizontal: 'right' };

      const imgRow = nextRow();
      imgRow.height = 70; // ~93px — covers BOX_H 90px plus padding
      try {
        const fmtMatch = /^data:image\/(\w+);base64,/.exec(p.data);
        const ext = (fmtMatch?.[1] ?? 'jpeg') as 'jpeg' | 'png' | 'gif';

        // Decode actual pixel dimensions to preserve aspect ratio
        const dims = await new Promise<{ w: number; h: number } | null>((resolve) => {
          const img = new globalThis.Image();
          img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
          img.onerror = () => resolve(null);
          img.src = p.data;
        });

        let drawW = BOX_W;
        let drawH = BOX_H;
        if (dims && dims.w > 0 && dims.h > 0) {
          const aspect = dims.w / dims.h;
          drawW = BOX_W;
          drawH = BOX_W / aspect;
          if (drawH > BOX_H) {
            drawH = BOX_H;
            drawW = BOX_H * aspect;
          }
        }

        const imgId = wb.addImage({ base64: p.data, extension: ext });
        ws.addImage(imgId, {
          tl: { col: 0.1, row: rowNum - 1 + 0.1 },
          ext: { width: drawW, height: drawH },
        });
      } catch {
        // Skip image if ExcelJS rejects the format
      }
      addSpacer();
    }
  }

  // ─── FOOTER ───
  addSpacer();
  addSpacer();
  const footerRow = nextRow();
  ws.mergeCells(rowNum, 1, rowNum, 3);
  footerRow.getCell(1).value = 'DKR Group \u00B7 dkrgroup.ru \u00B7 Конфиденциально';
  footerRow.getCell(1).font = footerFont;
  footerRow.getCell(1).alignment = { horizontal: 'center' };

  // Print area
  ws.pageSetup.printArea = `A1:C${rowNum}`;

  // Write file
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = makeFileName(state, 'xlsx');
  a.click();
  URL.revokeObjectURL(url);
}
