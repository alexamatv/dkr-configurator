import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { WizardState } from '@/types';
import { gatherDocData, makeFileName, type PostRow } from './gatherData';

function fmt(n: number): string {
  return n.toLocaleString('ru-RU') + ' \u20BD';
}

export function generatePdf(state: WizardState): void {
  const d = gatherDocData(state);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const marginL = 14;
  const marginR = 14;
  const contentW = pageW - marginL - marginR;
  let y = 16;

  function checkPage(needed: number) {
    if (y + needed > doc.internal.pageSize.getHeight() - 15) {
      doc.addPage();
      y = 16;
    }
  }

  function sectionTitle(title: string) {
    checkPage(14);
    y += 4;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(title, marginL, y);
    y += 7;
  }

  function simpleTable(rows: (string | number)[][]) {
    autoTable(doc, {
      startY: y,
      margin: { left: marginL, right: marginR },
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 1.5, font: 'helvetica' },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'normal', textColor: [100, 100, 100] },
        1: { cellWidth: contentW - 55 },
      },
      body: rows.map((r) => [String(r[0]), String(r[1])]),
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 2;
  }

  function priceTable(heading: string, items: PostRow[]) {
    if (items.length === 0) return;
    checkPage(10 + items.length * 6);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(heading, marginL, y);
    y += 1;

    autoTable(doc, {
      startY: y,
      margin: { left: marginL + 2, right: marginR },
      theme: 'striped',
      styles: { fontSize: 8.5, cellPadding: 1.5, font: 'helvetica' },
      headStyles: { fillColor: [50, 50, 60], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        0: { cellWidth: contentW - 40 },
        1: { cellWidth: 38, halign: 'right' },
      },
      head: [['Наименование', 'Цена']],
      body: items.map((r) => [r.name, fmt(r.price)]),
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 2;
  }

  // ─── HEADER ───
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Коммерческое предложение', marginL, y);
  y += 6;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('DKR Group', marginL, y);
  doc.setTextColor(0, 0, 0);
  y += 8;

  simpleTable([
    ['Дата', d.header.date],
    ['Менеджер', d.header.manager],
    ['Клиент', d.header.client],
    ['Тип транспорта', d.header.vehicleType],
    ['Тип объекта', d.header.objectType],
    ['Регион доставки', d.header.region],
    ['Валюта', d.header.currency],
  ]);

  // ─── TRUCK, ROBOT, or POSTS ───
  if (d.isTruck && d.truck) {
    sectionTitle('Грузовая мойка');
    checkPage(20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const currSymbol = d.truck.currency === 'USD' ? '$' : '₽';
    doc.text(`Тип: ${d.truck.typeName} — ${d.truck.typePrice.toLocaleString('ru-RU')} ${currSymbol}`, marginL + 2, y);
    y += 5;

    priceTable('Опции', d.truck.options);
    priceTable('Ручной пост', d.truck.manualPost);
    if (d.truck.manualPostMontage > 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Монтаж ручного поста: ${fmt(d.truck.manualPostMontage)}`, marginL + 2, y);
      y += 5;
    }
    if (d.truck.waterPrice > 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Водоочистка: ${d.truck.waterLabel} — ${fmt(d.truck.waterPrice)}`, marginL + 2, y);
      y += 5;
    }

    checkPage(8);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Итого грузовая мойка: ${fmt(d.truck.truckTotal)}`, marginL, y);
    y += 6;
  } else if (d.isRobot && d.robot) {
    sectionTitle('Робот');
    checkPage(20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Модель: ${d.robot.modelName} — ${fmt(d.robot.modelPrice)}`, marginL + 2, y);
    y += 5;
    doc.text(`БУР: ${d.robot.burName} — ${fmt(d.robot.burPrice)}`, marginL + 2, y);
    y += 4;

    priceTable('Опции робота', d.robot.options);

    checkPage(8);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Итого робот: ${fmt(d.robot.robotTotal)}`, marginL, y);
    y += 6;
  } else {
    d.posts.forEach((post) => {
      sectionTitle(post.title);

      checkPage(12);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Профиль: ${post.profileName}`, marginL + 2, y);
      y += 5;
      doc.text(`Базовая комплектация: ${fmt(post.basePrice)}`, marginL + 2, y);
      y += 5;
      doc.text(`Терминал: ${post.bumName}${post.bumPrice > 0 ? ' — доплата ' + fmt(post.bumPrice) : ' (в комплекте)'}`, marginL + 2, y);
      y += 4;

      priceTable('Системы оплаты', post.payments.filter((p) => p.price > 0));
      priceTable('Аксессуары', post.accessories);
      priceTable('Функции', post.functions);
      priceTable('Помпы (АВД)', post.pumps);

      const extrasWithPump = [...post.postExtras];
      if (post.secondPump) extrasWithPump.push(post.secondPump);
      priceTable('Доп. оборудование к посту', extrasWithPump);

      checkPage(8);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Итого по посту: ${fmt(post.postTotal)}`, marginL, y);
      y += 6;
    });
  }

  // ─── WASH (skip for truck) ───
  if (!d.isTruck) {
  sectionTitle('Оборудование на мойку');

  const washRows: PostRow[] = [];
  washRows.push({ name: `Водоподготовка: ${d.wash.waterLabel}`, price: d.wash.waterPrice });
  if (d.wash.vacuumPrice > 0) washRows.push({ name: `Пылесосы: ${d.wash.vacuumLabel}`, price: d.wash.vacuumPrice });
  d.wash.extras.forEach((e) => washRows.push(e));
  if (d.wash.pipelines.air > 0) washRows.push({ name: 'Магистрали воздушные', price: d.wash.pipelines.air });
  if (d.wash.pipelines.water > 0) washRows.push({ name: 'Магистрали водные', price: d.wash.pipelines.water });
  if (d.wash.pipelines.chem > 0) washRows.push({ name: 'Магистрали химические', price: d.wash.pipelines.chem });

  if (washRows.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: marginL, right: marginR },
      theme: 'striped',
      styles: { fontSize: 8.5, cellPadding: 1.5, font: 'helvetica' },
      headStyles: { fillColor: [50, 50, 60], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        0: { cellWidth: contentW - 38 },
        1: { cellWidth: 38, halign: 'right' },
      },
      head: [['Наименование', 'Цена']],
      body: washRows.map((r) => [r.name, fmt(r.price)]),
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 2;
  }

  checkPage(8);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Итого на мойку: ${fmt(d.wash.washTotal)}`, marginL, y);
  y += 8;
  } // end if !isTruck

  // ─── TOTALS ───
  sectionTitle('Итоговый расчёт');

  const totalsRows: [string, string][] = [
    ['Стоимость оборудования', fmt(d.totals.subtotal)],
    [`Скидка (${d.totals.discountPct}%)`, `- ${fmt(d.totals.discountAmount)}`],
    ['После скидки', fmt(d.totals.afterDiscount)],
  ];

  if (d.totals.montageAmount > 0) {
    totalsRows.push([`Монтаж (${d.totals.montageType})`, fmt(d.totals.montageFromSubtotal)]);
    if (d.totals.montageExtra > 0) {
      totalsRows.push(['Доп. работы по монтажу', fmt(d.totals.montageExtra)]);
    }
  } else {
    totalsRows.push(['Монтаж', 'Нет']);
  }

  if (d.totals.vatEnabled) {
    totalsRows.push([`НДС (${d.totals.vatPct}%)`, fmt(d.totals.vatAmount)]);
  } else {
    totalsRows.push(['НДС', 'Участник Сколково — не применяется']);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: marginL, right: marginR },
    theme: 'plain',
    styles: { fontSize: 9.5, cellPadding: 2, font: 'helvetica' },
    columnStyles: {
      0: { cellWidth: contentW - 45, fontStyle: 'normal' },
      1: { cellWidth: 45, halign: 'right', fontStyle: 'bold' },
    },
    body: totalsRows,
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

  // TOTAL line
  checkPage(14);
  doc.setDrawColor(50, 50, 60);
  doc.setLineWidth(0.5);
  doc.line(marginL, y, pageW - marginR, y);
  y += 6;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ИТОГО:', marginL, y);
  doc.text(fmt(d.totals.total), pageW - marginR, y, { align: 'right' });
  y += 10;

  // ─── CONDITIONS ───
  if (d.deliveryConditions !== '—' || d.paymentConditions !== '—') {
    sectionTitle('Условия');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    if (d.deliveryConditions !== '—') {
      doc.text('Условия доставки:', marginL, y);
      y += 4;
      const lines = doc.splitTextToSize(d.deliveryConditions, contentW - 4);
      doc.text(lines, marginL + 2, y);
      y += lines.length * 4 + 3;
    }

    if (d.paymentConditions !== '—') {
      checkPage(10);
      doc.text('Условия оплаты:', marginL, y);
      y += 4;
      const lines = doc.splitTextToSize(d.paymentConditions, contentW - 4);
      doc.text(lines, marginL + 2, y);
      y += lines.length * 4 + 3;
    }
  }

  const fileName = makeFileName(state, 'pdf');
  doc.save(fileName);
}
