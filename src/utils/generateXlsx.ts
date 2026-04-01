import ExcelJS from 'exceljs';
import type { WizardState } from '@/types';
import { gatherDocData, makeFileName, type PostRow } from './gatherData';

// ─── Palette ───
const DARK = '1E293B';
const BLUE = '0EA5E9';
const GRAY = '64748B';
const LINE_GRAY = 'E2E8F0';
const SUBTLE_BG = 'F8FAFC';

export async function generateXlsx(state: WizardState): Promise<void> {
  const d = gatherDocData(state);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('КП', {
    properties: { defaultColWidth: 18 },
  });

  // Column widths
  ws.getColumn(1).width = 45;
  ws.getColumn(2).width = 50;
  ws.getColumn(3).width = 18;

  // ─── Style presets ───
  const titleFont: Partial<ExcelJS.Font> = { bold: true, size: 14, name: 'Calibri', color: { argb: DARK } };
  const subtitleFont: Partial<ExcelJS.Font> = { bold: true, size: 12, name: 'Calibri', color: { argb: DARK } };
  const sectionFont: Partial<ExcelJS.Font> = { bold: true, size: 11, name: 'Calibri', color: { argb: DARK } };
  const boldFont: Partial<ExcelJS.Font> = { bold: true, size: 10, name: 'Calibri', color: { argb: DARK } };
  const normalFont: Partial<ExcelJS.Font> = { size: 10, name: 'Calibri', color: { argb: DARK } };
  const labelFont: Partial<ExcelJS.Font> = { size: 10, name: 'Calibri', color: { argb: GRAY } };
  const blueFont: Partial<ExcelJS.Font> = { bold: true, size: 10, name: 'Calibri', color: { argb: BLUE } };
  const totalFont: Partial<ExcelJS.Font> = { bold: true, size: 13, name: 'Calibri', color: { argb: BLUE } };
  const footerFont: Partial<ExcelJS.Font> = { italic: true, size: 8, name: 'Calibri', color: { argb: GRAY } };
  const pctFont: Partial<ExcelJS.Font> = { bold: true, size: 10, name: 'Calibri', color: { argb: BLUE } };
  const priceFormat = '#,##0" ₽"';

  const thinBlueBorder: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: BLUE } };
  const thinGrayBorder: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: LINE_GRAY } };
  const subtleFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: SUBTLE_BG } };

  let rowNum = 0;

  // ─── Row helpers ───

  function addRow(a?: string | number | null, b?: string | number | null, c?: string | number | null): ExcelJS.Row {
    rowNum++;
    const row = ws.getRow(rowNum);
    row.getCell(1).value = a ?? null;
    row.getCell(2).value = b ?? null;
    row.getCell(3).value = c ?? null;
    row.font = normalFont;
    return row;
  }

  function addSpacer() {
    addRow();
  }

  function addSectionRow(text: string): ExcelJS.Row {
    addSpacer();
    const row = addRow(text);
    ws.mergeCells(rowNum, 1, rowNum, 3);
    row.getCell(1).font = sectionFont;
    row.getCell(1).border = { bottom: thinBlueBorder };
    row.height = 22;
    return row;
  }

  function addInfoRow(label: string, value: string | number) {
    const row = addRow(label, value);
    row.getCell(1).font = labelFont;
    row.getCell(2).font = boldFont;
    row.getCell(1).border = { bottom: thinGrayBorder };
    row.getCell(2).border = { bottom: thinGrayBorder };
    row.getCell(3).border = { bottom: thinGrayBorder };
    return row;
  }

  /** Writes a price number into C column; returns the row number for formula tracking */
  function addPriceRow(label: string, name: string, price: number, stripe = false): number {
    const row = addRow(label, name, price);
    row.getCell(1).font = labelFont;
    row.getCell(2).font = normalFont;
    row.getCell(3).font = normalFont;
    row.getCell(3).numFmt = priceFormat;
    row.getCell(1).border = { bottom: thinGrayBorder };
    row.getCell(2).border = { bottom: thinGrayBorder };
    row.getCell(3).border = { bottom: thinGrayBorder };
    if (stripe) {
      row.getCell(1).fill = subtleFill;
      row.getCell(2).fill = subtleFill;
      row.getCell(3).fill = subtleFill;
    }
    return rowNum;
  }

  /** Writes a SUM formula into C column referencing tracked rows; returns row number */
  function addFormulaSubtotal(label: string, trackedRows: number[], fallback: number): number {
    rowNum++;
    const row = ws.getRow(rowNum);
    row.getCell(1).value = label;
    row.getCell(1).font = blueFont;
    row.getCell(2).value = null;
    if (trackedRows.length > 0) {
      row.getCell(3).value = { formula: sumOf(trackedRows), result: fallback };
    } else {
      row.getCell(3).value = 0;
    }
    row.getCell(3).font = blueFont;
    row.getCell(3).numFmt = priceFormat;
    return rowNum;
  }

  /** Writes an arbitrary formula into C column; returns row number */
  function addFormulaRow(label: string, formula: string, fallback: number, font: Partial<ExcelJS.Font> = normalFont): number {
    const row = addRow(label, null, null);
    row.getCell(1).font = labelFont;
    row.getCell(3).value = { formula, result: fallback };
    row.getCell(3).font = font;
    row.getCell(3).numFmt = priceFormat;
    row.getCell(1).border = { bottom: thinGrayBorder };
    row.getCell(2).border = { bottom: thinGrayBorder };
    row.getCell(3).border = { bottom: thinGrayBorder };
    return rowNum;
  }

  /** Adds editable % value in B column; C column left empty for formula set after. Returns row number. */
  function addPctRow(label: string, pctValue: number): number {
    const row = addRow(label, pctValue, null);
    row.getCell(1).font = labelFont;
    row.getCell(2).font = pctFont;
    row.getCell(2).numFmt = '#0"%"';
    row.getCell(3).font = normalFont;
    row.getCell(3).numFmt = priceFormat;
    row.getCell(1).border = { bottom: thinGrayBorder };
    row.getCell(2).border = { bottom: thinGrayBorder };
    row.getCell(3).border = { bottom: thinGrayBorder };
    return rowNum;
  }

  /** Sets formula on C column of a given row */
  function setFormula(row: number, formula: string, fallback: number) {
    ws.getRow(row).getCell(3).value = { formula, result: fallback };
  }

  /** Adds a block of price items with heading; returns row numbers of all price cells */
  function addPriceBlock(heading: string, items: PostRow[]): number[] {
    if (items.length === 0) return [];
    const headRow = addRow('', heading, 'Цена');
    headRow.getCell(2).font = { ...boldFont, size: 9 };
    headRow.getCell(3).font = { ...boldFont, size: 9 };
    headRow.getCell(2).border = { bottom: thinBlueBorder };
    headRow.getCell(3).border = { bottom: thinBlueBorder };
    headRow.getCell(3).alignment = { horizontal: 'right' };
    const rows: number[] = [];
    items.forEach((r, i) => {
      rows.push(addPriceRow('', r.name, r.price, i % 2 === 1));
    });
    return rows;
  }

  // ─── Formula helpers ───

  function sumOf(rows: number[]): string {
    if (rows.length === 0) return '0';
    if (rows.length === 1) return `C${rows[0]}`;
    return 'SUM(' + rows.map((r) => `C${r}`).join(',') + ')';
  }

  function cellC(row: number): string {
    return `C${row}`;
  }

  function cellB(row: number): string {
    return `B${row}`;
  }

  // ═══════════════════════════════════════
  // DOCUMENT
  // ═══════════════════════════════════════

  // Row 1: empty
  addSpacer();

  // Row 2: DKR GROUP + КП title
  const titleRow = addRow('DKR GROUP', '', 'Коммерческое предложение');
  titleRow.getCell(1).font = titleFont;
  titleRow.getCell(3).font = subtitleFont;
  titleRow.getCell(3).alignment = { horizontal: 'right' };
  titleRow.height = 24;

  // Row 3: thin blue line under header
  const lineRow = addRow();
  lineRow.getCell(1).border = { bottom: thinBlueBorder };
  lineRow.getCell(2).border = { bottom: thinBlueBorder };
  lineRow.getCell(3).border = { bottom: thinBlueBorder };

  addSpacer();
  addInfoRow('Дата', d.header.date);
  addInfoRow('Менеджер', d.header.manager);
  addInfoRow('Клиент', d.header.client);
  addInfoRow('Тип транспорта', d.header.vehicleType);
  addInfoRow('Тип объекта', d.header.objectType);
  addInfoRow('Регион доставки', d.header.region);

  // ─── Tracked subtotal rows for the final equipment formula ───
  const equipmentSubtotalRows: number[] = [];

  // ─── TRUCK, ROBOT, or POSTS ───
  if (d.isTruck && d.truck) {
    addSectionRow('Грузовая мойка');
    const truckPriceRows: number[] = [];

    truckPriceRows.push(addPriceRow('Тип мойки', d.truck.typeName, d.truck.typePrice));
    truckPriceRows.push(...addPriceBlock('Опции', d.truck.options));

    if (d.truck.manualPost.length > 0) {
      truckPriceRows.push(...addPriceBlock('Ручной пост', d.truck.manualPost));
      if (d.truck.manualPostMontage > 0) {
        truckPriceRows.push(addPriceRow('', 'Монтаж ручного поста', d.truck.manualPostMontage));
      }
    }
    if (d.truck.waterPrice > 0) {
      truckPriceRows.push(addPriceRow('Водоочистка', d.truck.waterLabel, d.truck.waterPrice));
    }

    const truckSub = addFormulaSubtotal('Итого грузовая мойка', truckPriceRows, d.truck.truckTotal);
    equipmentSubtotalRows.push(truckSub);

  } else if (d.isRobot && d.robot) {
    addSectionRow('Робот');
    const robotPriceRows: number[] = [];

    robotPriceRows.push(addPriceRow('Модель', d.robot.modelName, d.robot.modelPrice));
    if (d.robot.includedComponents.length > 0) {
      addInfoRow('В комплекте', d.robot.includedComponents.join(', '));
    }
    robotPriceRows.push(addPriceRow('БУР', d.robot.burName, d.robot.burPrice));
    robotPriceRows.push(...addPriceBlock('Опции робота', d.robot.options));

    const robotSub = addFormulaSubtotal('Итого робот', robotPriceRows, d.robot.robotTotal);
    equipmentSubtotalRows.push(robotSub);

  } else {
    d.posts.forEach((post) => {
      addSectionRow(post.title);
      addInfoRow('Профиль', post.profileName);
      const postPriceRows: number[] = [];

      postPriceRows.push(addPriceRow('Базовая комплектация', '', post.basePrice));

      if (post.bumPrice > 0) {
        postPriceRows.push(addPriceRow('Терминал (доплата)', post.bumName, post.bumPrice));
      } else {
        postPriceRows.push(addPriceRow('Терминал', post.bumName + ' (в комплекте)', 0));
      }

      postPriceRows.push(...addPriceBlock('Системы оплаты', post.payments));
      postPriceRows.push(...addPriceBlock('Аксессуары', post.accessories));

      if (post.baseFunctions.length > 0) {
        postPriceRows.push(...addPriceBlock('Базовые функции (в комплекте)', post.baseFunctions));
      }
      postPriceRows.push(...addPriceBlock('Функции', post.functions));
      postPriceRows.push(...addPriceBlock('Помпы (АВД)', post.pumps));

      const extrasWithPump = [...post.postExtras];
      if (post.secondPump) extrasWithPump.push(post.secondPump);
      postPriceRows.push(...addPriceBlock('Доп. оборудование к посту', extrasWithPump));

      const postSub = addFormulaSubtotal('Итого по посту', postPriceRows, post.postTotal);
      equipmentSubtotalRows.push(postSub);
    });
  }

  // ─── WASH BLOCK ───
  if (!d.isTruck) {
    addSectionRow('Оборудование на мойку');
    const washPriceRows: number[] = [];

    if (d.wash.waterRows.length > 0) {
      washPriceRows.push(...addPriceBlock('Водоподготовка', d.wash.waterRows));
    }

    if (d.wash.vacuumPrice > 0) {
      washPriceRows.push(addPriceRow('Пылесосы', d.wash.vacuumLabel, d.wash.vacuumPrice));
    }

    if (d.wash.extras.length > 0) {
      washPriceRows.push(...addPriceBlock('Другое оборудование', d.wash.extras));
    }

    if (d.wash.pipelines.air > 0 || d.wash.pipelines.water > 0 || d.wash.pipelines.chem > 0) {
      const pipRows: PostRow[] = [];
      if (d.wash.pipelines.air > 0) pipRows.push({ name: 'Воздушные', price: d.wash.pipelines.air });
      if (d.wash.pipelines.water > 0) pipRows.push({ name: 'Водные', price: d.wash.pipelines.water });
      if (d.wash.pipelines.chem > 0) pipRows.push({ name: 'Химические', price: d.wash.pipelines.chem });
      washPriceRows.push(...addPriceBlock('Магистрали', pipRows));
    }

    const washSub = addFormulaSubtotal('Итого на мойку', washPriceRows, d.wash.washTotal);
    equipmentSubtotalRows.push(washSub);
  }

  // ═══════════════════════════════════════
  // TOTALS SECTION — all formulas
  // ═══════════════════════════════════════
  addSectionRow('Итоговый расчёт');

  // Equipment subtotal = SUM of all section subtotals
  const equipRow = addFormulaSubtotal('Стоимость оборудования', equipmentSubtotalRows, d.totals.subtotal);

  // Discount: editable % in B, formula in C
  const discountRow = addPctRow('Скидка, %', d.totals.discountPct);
  setFormula(discountRow, `${cellC(equipRow)}*${cellB(discountRow)}/100`, d.totals.discountAmount);
  if (d.totals.discountWarning) {
    ws.getRow(discountRow).getCell(2).note = '⚠ Скидка больше 3% — требуется согласование';
  }

  // After discount = equipment - discount
  const afterDiscRow = addFormulaRow(
    'После скидки',
    `${cellC(equipRow)}-${cellC(discountRow)}`,
    d.totals.afterDiscount,
    boldFont,
  );

  // Montage: editable % in B (or fixed for КОМПАК), formula in C
  const isKompakTruck = d.isTruck && d.truck && d.totals.montageType.includes('фикс');
  let montageRow: number;
  if (isKompakTruck) {
    // КОМПАК: fixed montage, editable as plain number
    montageRow = addPriceRow(`Монтаж (${d.totals.montageType})`, '', d.totals.montageFromSubtotal);
  } else {
    const montagePct = d.totals.montageAmount > 0
      ? (d.totals.montageType.includes('10') ? 10 : d.totals.montageType.includes('5') ? 5 : 0)
      : 0;
    montageRow = addPctRow('Монтаж, %', montagePct);
    // Montage calculated from subtotal BEFORE discount
    setFormula(montageRow, `${cellC(equipRow)}*${cellB(montageRow)}/100`, d.totals.montageFromSubtotal);
  }

  // Montage extra: editable plain number
  let montageExtraRow: number | null = null;
  if (d.totals.montageExtra > 0 || d.totals.montageAmount > 0) {
    montageExtraRow = addPriceRow('Доп. работы по монтажу', '', d.totals.montageExtra);
  }

  // VAT: editable % in B, formula in C
  // НДС = (После скидки + Монтаж + Доп. работы) × %
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

  // ─── ИТОГО line ───
  const totalLineRow = addRow();
  totalLineRow.getCell(1).border = { bottom: { style: 'medium', color: { argb: DARK } } };
  totalLineRow.getCell(2).border = { bottom: { style: 'medium', color: { argb: DARK } } };
  totalLineRow.getCell(3).border = { bottom: { style: 'medium', color: { argb: DARK } } };

  // ИТОГО = После скидки + Монтаж + Доп. работы + НДС
  const grandParts = [cellC(afterDiscRow), cellC(montageRow), cellC(vatRow)];
  if (montageExtraRow) grandParts.splice(2, 0, cellC(montageExtraRow));
  const grandFormula = grandParts.join('+');

  rowNum++;
  const grandRow = ws.getRow(rowNum);
  ws.mergeCells(rowNum, 1, rowNum, 2);
  grandRow.getCell(1).value = 'ИТОГО';
  grandRow.getCell(1).font = totalFont;
  grandRow.getCell(3).value = { formula: grandFormula, result: d.totals.total };
  grandRow.getCell(3).font = totalFont;
  grandRow.getCell(3).numFmt = priceFormat;
  grandRow.getCell(3).alignment = { horizontal: 'right' };
  grandRow.height = 28;

  // ─── CONDITIONS ───
  addSectionRow('Условия');
  addInfoRow('Условия доставки', d.deliveryConditions);
  addInfoRow('Условия оплаты', d.paymentConditions);

  // ─── FOOTER ───
  addSpacer();
  const footerRow = addRow('DKR Group  |  dkrgroup.ru  |  Конфиденциально');
  ws.mergeCells(rowNum, 1, rowNum, 3);
  footerRow.getCell(1).font = footerFont;
  footerRow.getCell(1).alignment = { horizontal: 'center' };

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
