import ExcelJS from 'exceljs';
import type { WizardState } from '@/types';
import { gatherDocData, makeFileName, type PostRow } from './gatherData';

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

export async function generateXlsx(state: WizardState): Promise<void> {
  const d = gatherDocData(state);
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
    row.getCell(3).value = price;
    row.getCell(3).font = priceFont;
    row.getCell(3).numFmt = priceFormat;
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
    if (d.robot.includedComponents.length > 0) {
      addInfoRow('В комплекте', d.robot.includedComponents.join(', '));
    }
    priceRows.push(addPriceRow(`БУР: ${d.robot.burName}`, d.robot.burPrice));
    priceRows.push(...addPriceBlock('Опции робота', d.robot.options));
    if (d.robot.extras && d.robot.extras.length > 0) {
      priceRows.push(...addPriceBlock('Доп. оборудование', d.robot.extras));
    }

    equipmentSubtotalRows.push(addFormulaSubtotal('Итого робот', priceRows, d.robot.robotTotal));

  } else {
    d.posts.forEach((post) => {
      addSectionRow(post.title);
      addInfoRow('Профиль', post.profileName);
      const priceRows: number[] = [];

      priceRows.push(addPriceRow('Базовая комплектация', post.basePrice));

      if (post.bumPrice > 0) {
        priceRows.push(addPriceRow(`Терминал: ${post.bumName} (доплата)`, post.bumPrice));
      } else {
        priceRows.push(addPriceRow(`Терминал: ${post.bumName} (в комплекте)`, 0));
      }

      priceRows.push(...addPriceBlock('Системы оплаты', post.payments));
      priceRows.push(...addPriceBlock('Аксессуары', post.accessories));

      if (post.baseFunctions.length > 0) {
        priceRows.push(...addPriceBlock('Базовые функции (в комплекте)', post.baseFunctions));
      }
      priceRows.push(...addPriceBlock('Функции мойки', post.functions));
      priceRows.push(...addPriceBlock('АВД (помпы)', post.pumps));

      const extrasWithPump = [...post.postExtras];
      if (post.secondPump) extrasWithPump.push(post.secondPump);
      priceRows.push(...addPriceBlock('Доп. оборудование к посту', extrasWithPump));

      equipmentSubtotalRows.push(addFormulaSubtotal('Итого по посту', priceRows, post.postTotal));
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
