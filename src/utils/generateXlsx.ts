import * as XLSX from 'xlsx';
import type { WizardState } from '@/types';
import { gatherDocData, makeFileName, type DocData, type PostBlock, type PostRow } from './gatherData';

function fmt(n: number): string {
  return n.toLocaleString('ru-RU');
}

export function generateXlsx(state: WizardState): void {
  const d = gatherDocData(state);
  const wb = XLSX.utils.book_new();
  const rows: (string | number | null)[][] = [];

  const LABEL = 0; // col A
  const VALUE = 1; // col B
  const PRICE = 2; // col C

  const boldRows: number[] = [];
  const sectionRows: number[] = [];

  function addRow(a?: string | number | null, b?: string | number | null, c?: string | number | null) {
    rows.push([a ?? null, b ?? null, c ?? null]);
    return rows.length - 1;
  }
  function addBold(a?: string | number | null, b?: string | number | null, c?: string | number | null) {
    const r = addRow(a, b, c);
    boldRows.push(r);
    return r;
  }
  function addSection(title: string) {
    addRow();
    const r = addBold(title);
    sectionRows.push(r);
    return r;
  }

  // ─── HEADER ───
  addBold('Коммерческое предложение — DKR Group');
  addRow();
  addRow('Дата', d.header.date);
  addRow('Менеджер', d.header.manager);
  addRow('Клиент', d.header.client);
  addRow('Тип транспорта', d.header.vehicleType);
  addRow('Тип объекта', d.header.objectType);
  addRow('Регион доставки', d.header.region);
  addRow('Валюта', d.header.currency);

  // ─── POSTS ───
  d.posts.forEach((post, postIdx) => {
    addSection(post.title);
    addRow('Профиль', post.profileName);
    addRow('Базовая комплектация', '', post.basePrice);

    if (post.bumPrice > 0) {
      addRow('Терминал (доплата)', post.bumName, post.bumPrice);
    } else {
      addRow('Терминал', post.bumName + ' (в комплекте)', 0);
    }

    if (post.payments.length > 0) {
      addRow('Системы оплаты');
      post.payments.forEach((r) => addRow('', r.name, r.price));
    }

    if (post.accessories.length > 0) {
      addRow('Аксессуары');
      post.accessories.forEach((r) => addRow('', r.name, r.price));
    }

    if (post.functions.length > 0) {
      addRow('Функции');
      post.functions.forEach((r) => addRow('', r.name, r.price));
    }

    if (post.pumps.length > 0) {
      addRow('Помпы (АВД)');
      post.pumps.forEach((r) => addRow('', r.name, r.price));
    }

    if (post.postExtras.length > 0) {
      addRow('Доп. оборудование к посту');
      post.postExtras.forEach((r) => addRow('', r.name, r.price));
    }

    if (post.secondPump) {
      addRow('', post.secondPump.name, post.secondPump.price);
    }

    // Post subtotal with SUM formula
    const firstPriceRow = rows.findIndex((_, i) => i > rows.length - 30 && rows[i]?.[PRICE] !== null && typeof rows[i]?.[PRICE] === 'number');
    addBold('Итого по посту', '', post.postTotal);
  });

  // ─── WASH BLOCK ───
  addSection('Оборудование на мойку');
  addRow('Водоподготовка', d.wash.waterLabel, d.wash.waterPrice);

  if (d.wash.vacuumPrice > 0) {
    addRow('Пылесосы', d.wash.vacuumLabel, d.wash.vacuumPrice);
  }

  if (d.wash.extras.length > 0) {
    addRow('Другое оборудование');
    d.wash.extras.forEach((r) => addRow('', r.name, r.price));
  }

  if (d.wash.pipelines.air > 0 || d.wash.pipelines.water > 0 || d.wash.pipelines.chem > 0) {
    addRow('Магистрали');
    if (d.wash.pipelines.air > 0) addRow('', 'Воздушные', d.wash.pipelines.air);
    if (d.wash.pipelines.water > 0) addRow('', 'Водные', d.wash.pipelines.water);
    if (d.wash.pipelines.chem > 0) addRow('', 'Химические', d.wash.pipelines.chem);
  }

  addBold('Итого на мойку', '', d.wash.washTotal);

  // ─── TOTALS ───
  addSection('Итоговый расчёт');
  addRow('Стоимость оборудования', '', d.totals.subtotal);
  addRow(`Скидка (${d.totals.discountPct}%)`, '', -d.totals.discountAmount);
  addRow('После скидки', '', d.totals.afterDiscount);

  if (d.totals.montageAmount > 0) {
    addRow(`Монтаж (${d.totals.montageType})`, '', d.totals.montageFromSubtotal);
    if (d.totals.montageExtra > 0) {
      addRow('Доп. работы по монтажу', '', d.totals.montageExtra);
    }
  } else {
    addRow('Монтаж', 'Нет', 0);
  }

  if (d.totals.vatEnabled) {
    addRow(`НДС (${d.totals.vatPct}%)`, '', d.totals.vatAmount);
  } else {
    addRow('НДС', 'Участник Сколково — не применяется', 0);
  }

  addRow();
  addBold('ИТОГО', '', d.totals.total);

  // ─── CONDITIONS ───
  addSection('Условия');
  addRow('Условия доставки', d.deliveryConditions);
  addRow('Условия оплаты', d.paymentConditions);

  // Build worksheet
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  ws['!cols'] = [
    { wch: 30 },
    { wch: 40 },
    { wch: 18 },
  ];

  // Number format for price column — apply #,##0 to all numeric cells in col C
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1:C1');
  for (let r = range.s.r; r <= range.e.r; r++) {
    const addr = XLSX.utils.encode_cell({ r, c: PRICE });
    const cell = ws[addr];
    if (cell && typeof cell.v === 'number') {
      cell.z = '#,##0" ₽"';
    }
  }

  // Bold styling (SheetJS community edition has limited style support,
  // but we set cell types correctly so Excel renders numbers properly)

  XLSX.utils.book_append_sheet(wb, ws, 'КП');

  const fileName = makeFileName(state, 'xlsx');
  XLSX.writeFile(wb, fileName);
}
