import ExcelJS from 'exceljs';
import type { WizardState } from '@/types';
import { gatherDocData, makeFileName, type PostRow } from './gatherData';

// ─── Palette ───
const DARK = '1E293B';
const BLUE = '0EA5E9';
const GRAY = '64748B';
const LINE_GRAY = 'E2E8F0';
const SUBTLE_BG = 'F8FAFC';

function fmt(n: number): string {
  return n.toLocaleString('ru-RU');
}

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
  const priceFormat = '#,##0" ₽"';

  const thinBlueBorder: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: BLUE } };
  const thinGrayBorder: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: LINE_GRAY } };
  const subtleFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: SUBTLE_BG } };

  let rowNum = 0;

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

  function addPriceRow(label: string, name: string, price: number, stripe = false) {
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
    return row;
  }

  function addSubtotalRow(label: string, price: number) {
    const row = addRow(label, '', price);
    row.getCell(1).font = blueFont;
    row.getCell(3).font = blueFont;
    row.getCell(3).numFmt = priceFormat;
    return row;
  }

  function addPriceBlock(heading: string, items: PostRow[]) {
    if (items.length === 0) return;
    // Subtle table header
    const headRow = addRow('', heading, 'Цена');
    headRow.getCell(2).font = { ...boldFont, size: 9 };
    headRow.getCell(3).font = { ...boldFont, size: 9 };
    headRow.getCell(2).border = { bottom: thinBlueBorder };
    headRow.getCell(3).border = { bottom: thinBlueBorder };
    headRow.getCell(3).alignment = { horizontal: 'right' };
    // Items
    items.forEach((r, i) => {
      addPriceRow('', r.name, r.price, i % 2 === 1);
    });
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

  // ─── TRUCK, ROBOT, or POSTS ───
  if (d.isTruck && d.truck) {
    addSectionRow('Грузовая мойка');
    addPriceRow('Тип мойки', d.truck.typeName, d.truck.typePrice);
    addPriceBlock('Опции', d.truck.options);
    if (d.truck.manualPost.length > 0) {
      addPriceBlock('Ручной пост', d.truck.manualPost);
      if (d.truck.manualPostMontage > 0) {
        addPriceRow('', 'Монтаж ручного поста', d.truck.manualPostMontage);
      }
    }
    if (d.truck.waterPrice > 0) {
      addPriceRow('Водоочистка', d.truck.waterLabel, d.truck.waterPrice);
    }
    addSubtotalRow('Итого грузовая мойка', d.truck.truckTotal);
  } else if (d.isRobot && d.robot) {
    addSectionRow('Робот');
    addPriceRow('Модель', d.robot.modelName, d.robot.modelPrice);
    if (d.robot.includedComponents.length > 0) {
      addInfoRow('В комплекте', d.robot.includedComponents.join(', '));
    }
    addPriceRow('БУР', d.robot.burName, d.robot.burPrice);
    addPriceBlock('Опции робота', d.robot.options);
    addSubtotalRow('Итого робот', d.robot.robotTotal);
  } else {
    d.posts.forEach((post) => {
      addSectionRow(post.title);
      addInfoRow('Профиль', post.profileName);
      addPriceRow('Базовая комплектация', '', post.basePrice);

      if (post.bumPrice > 0) {
        addPriceRow('Терминал (доплата)', post.bumName, post.bumPrice);
      } else {
        addPriceRow('Терминал', post.bumName + ' (в комплекте)', 0);
      }

      addPriceBlock('Системы оплаты', post.payments);
      addPriceBlock('Аксессуары', post.accessories);

      if (post.baseFunctions.length > 0) {
        addPriceBlock('Базовые функции (в комплекте)', post.baseFunctions);
      }
      addPriceBlock('Функции', post.functions);
      addPriceBlock('Помпы (АВД)', post.pumps);

      const extrasWithPump = [...post.postExtras];
      if (post.secondPump) extrasWithPump.push(post.secondPump);
      addPriceBlock('Доп. оборудование к посту', extrasWithPump);

      addSubtotalRow('Итого по посту', post.postTotal);
    });
  }

  // ─── WASH BLOCK ───
  if (!d.isTruck) {
    addSectionRow('Оборудование на мойку');

    if (d.wash.waterRows.length > 0) {
      addPriceBlock('Водоподготовка', d.wash.waterRows);
      if (d.wash.waterTotal > 0) {
        addSubtotalRow('Итого водоподготовка', d.wash.waterTotal);
      }
    }

    if (d.wash.vacuumPrice > 0) {
      addPriceRow('Пылесосы', d.wash.vacuumLabel, d.wash.vacuumPrice);
    }

    if (d.wash.extras.length > 0) {
      addPriceBlock('Другое оборудование', d.wash.extras);
    }

    if (d.wash.pipelines.air > 0 || d.wash.pipelines.water > 0 || d.wash.pipelines.chem > 0) {
      const pipRows: PostRow[] = [];
      if (d.wash.pipelines.air > 0) pipRows.push({ name: 'Воздушные', price: d.wash.pipelines.air });
      if (d.wash.pipelines.water > 0) pipRows.push({ name: 'Водные', price: d.wash.pipelines.water });
      if (d.wash.pipelines.chem > 0) pipRows.push({ name: 'Химические', price: d.wash.pipelines.chem });
      addPriceBlock('Магистрали', pipRows);
    }

    addSubtotalRow('Итого на мойку', d.wash.washTotal);
  }

  // ─── TOTALS ───
  addSectionRow('Итоговый расчёт');
  addPriceRow('Стоимость оборудования', '', d.totals.subtotal);
  addPriceRow(`Скидка (${d.totals.discountPct}%)`, d.totals.discountWarning ? '⚠ Скидка > 3%' : '', -d.totals.discountAmount);
  addPriceRow('После скидки', '', d.totals.afterDiscount);

  if (d.totals.montageAmount > 0) {
    addPriceRow(`Монтаж (${d.totals.montageType})`, '', d.totals.montageFromSubtotal);
    if (d.totals.montageExtra > 0) {
      addPriceRow('Доп. работы по монтажу', '', d.totals.montageExtra);
    }
  } else {
    addPriceRow('Монтаж', 'Нет', 0);
  }

  if (d.totals.vatEnabled) {
    addPriceRow(`НДС (${d.totals.vatPct}%)`, '', d.totals.vatAmount);
  } else {
    addInfoRow('НДС', 'Участник Сколково — не применяется');
  }

  addSpacer();

  // TOTAL row — bold blue text with thin line above, no fill
  const totalLineRow = addRow();
  totalLineRow.getCell(1).border = { bottom: { style: 'medium', color: { argb: DARK } } };
  totalLineRow.getCell(2).border = { bottom: { style: 'medium', color: { argb: DARK } } };
  totalLineRow.getCell(3).border = { bottom: { style: 'medium', color: { argb: DARK } } };

  const totalRow = addRow('ИТОГО', '', d.totals.total);
  ws.mergeCells(rowNum, 1, rowNum, 2);
  totalRow.getCell(1).font = totalFont;
  totalRow.getCell(3).font = totalFont;
  totalRow.getCell(3).numFmt = priceFormat;
  totalRow.getCell(3).alignment = { horizontal: 'right' };
  totalRow.height = 28;

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
