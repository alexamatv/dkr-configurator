import ExcelJS from 'exceljs';
import type { WizardState } from '@/types';
import { gatherDocData, makeFileName, type PostRow } from './gatherData';

// ─── Brand colors ───
const BLUE = '0EA5E9';
const DARK = '1E293B';
const STRIPE = 'F8FAFC';
const WHITE = 'FFFFFF';
const BLUE_TEXT = '0EA5E9';

function fmt(n: number): string {
  return n.toLocaleString('ru-RU');
}

export async function generateXlsx(state: WizardState): Promise<void> {
  const d = gatherDocData(state);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('КП', {
    properties: { defaultColWidth: 20 },
  });

  // Column widths
  ws.getColumn(1).width = 35;
  ws.getColumn(2).width = 45;
  ws.getColumn(3).width = 22;

  const headerFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK } };
  const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: WHITE }, size: 14, name: 'Calibri' };
  const sectionFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } };
  const sectionFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: WHITE }, size: 11, name: 'Calibri' };
  const boldFont: Partial<ExcelJS.Font> = { bold: true, size: 10, name: 'Calibri' };
  const normalFont: Partial<ExcelJS.Font> = { size: 10, name: 'Calibri' };
  const labelFont: Partial<ExcelJS.Font> = { size: 10, name: 'Calibri', color: { argb: '64748B' } };
  const subtotalFont: Partial<ExcelJS.Font> = { bold: true, size: 10, name: 'Calibri', color: { argb: BLUE_TEXT } };
  const totalFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } };
  const totalFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: WHITE }, size: 13, name: 'Calibri' };
  const stripeFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: STRIPE } };
  const priceFormat = '#,##0" ₽"';

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

  function addHeaderRow(text: string): ExcelJS.Row {
    const row = addRow(text);
    ws.mergeCells(rowNum, 1, rowNum, 3);
    row.getCell(1).fill = headerFill;
    row.getCell(1).font = headerFont;
    row.getCell(1).alignment = { vertical: 'middle' };
    row.height = 30;
    return row;
  }

  function addSectionRow(text: string): ExcelJS.Row {
    addRow(); // spacer
    const row = addRow(text);
    ws.mergeCells(rowNum, 1, rowNum, 3);
    row.getCell(1).fill = sectionFill;
    row.getCell(1).font = sectionFont;
    row.getCell(1).alignment = { vertical: 'middle' };
    row.height = 24;
    return row;
  }

  function addInfoRow(label: string, value: string | number) {
    const row = addRow(label, value);
    row.getCell(1).font = labelFont;
    row.getCell(2).font = boldFont;
    return row;
  }

  function addPriceRow(label: string, name: string, price: number, stripe = false) {
    const row = addRow(label, name, price);
    row.getCell(1).font = labelFont;
    row.getCell(2).font = normalFont;
    row.getCell(3).font = normalFont;
    row.getCell(3).numFmt = priceFormat;
    if (stripe) {
      row.getCell(1).fill = stripeFill;
      row.getCell(2).fill = stripeFill;
      row.getCell(3).fill = stripeFill;
    }
    return row;
  }

  function addSubtotalRow(label: string, price: number) {
    const row = addRow(label, '', price);
    row.getCell(1).font = subtotalFont;
    row.getCell(3).font = subtotalFont;
    row.getCell(3).numFmt = priceFormat;
    return row;
  }

  function addPriceBlock(heading: string, items: PostRow[]) {
    if (items.length === 0) return;
    // Table header
    const headRow = addRow('', heading, 'Цена');
    headRow.getCell(2).font = { ...sectionFont, size: 9 };
    headRow.getCell(3).font = { ...sectionFont, size: 9 };
    headRow.getCell(2).fill = sectionFill;
    headRow.getCell(3).fill = sectionFill;
    headRow.getCell(3).alignment = { horizontal: 'right' };
    // Items
    items.forEach((r, i) => {
      addPriceRow('', r.name, r.price, i % 2 === 1);
    });
  }

  // ═══════════════════════════════════════
  // DOCUMENT
  // ═══════════════════════════════════════

  // Header
  addHeaderRow('DKR GROUP — Коммерческое предложение');

  addRow(); // spacer
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
    addPriceRow('Водоподготовка', d.wash.waterLabel, d.wash.waterPrice);

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
  addPriceRow(`Скидка (${d.totals.discountPct}%)`, '', -d.totals.discountAmount);
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

  addRow(); // spacer

  // TOTAL row with blue background
  const totalRow = addRow('ИТОГО', '', d.totals.total);
  ws.mergeCells(rowNum, 1, rowNum, 2);
  totalRow.getCell(1).fill = totalFill;
  totalRow.getCell(1).font = totalFont;
  totalRow.getCell(3).fill = totalFill;
  totalRow.getCell(3).font = totalFont;
  totalRow.getCell(3).numFmt = priceFormat;
  totalRow.getCell(3).alignment = { horizontal: 'right' };
  totalRow.height = 28;

  // ─── CONDITIONS ───
  addSectionRow('Условия');
  addInfoRow('Условия доставки', d.deliveryConditions);
  addInfoRow('Условия оплаты', d.paymentConditions);

  // ─── FOOTER ───
  addRow();
  const footerRow = addRow('DKR Group  |  dkrgroup.ru  |  Конфиденциально');
  ws.mergeCells(rowNum, 1, rowNum, 3);
  footerRow.getCell(1).font = { ...labelFont, italic: true, size: 8 };
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
