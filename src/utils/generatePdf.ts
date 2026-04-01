import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { WizardState } from '@/types';
import { gatherDocData, makeFileName, type PostRow } from './gatherData';
import { robotoRegular } from '../fonts/roboto-regular';
import { robotoBold } from '../fonts/roboto-bold';

// ─── Brand colors ───
const BLUE: [number, number, number] = [14, 165, 233]; // #0EA5E9
const DARK: [number, number, number] = [30, 41, 59];   // #1E293B
const TEXT: [number, number, number] = [17, 24, 39];    // #111827
const MUTED: [number, number, number] = [100, 116, 139]; // #64748B
const STRIPE: [number, number, number] = [248, 250, 252]; // #F8FAFC
const WHITE: [number, number, number] = [255, 255, 255];

function fmt(n: number): string {
  return n.toLocaleString('ru-RU') + ' \u20BD';
}

export function generatePdf(state: WizardState): void {
  const d = gatherDocData(state);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ─── Register Roboto font ───
  doc.addFileToVFS('Roboto-Regular.ttf', robotoRegular);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFileToVFS('Roboto-Bold.ttf', robotoBold);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
  doc.setFont('Roboto');

  const FONT = 'Roboto';
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginL = 14;
  const marginR = 14;
  const contentW = pageW - marginL - marginR;
  const headerH = 18;
  const footerH = 12;
  let y = headerH + 6;

  // ─── Header / Footer drawn on every page ───
  function drawHeaderFooter() {
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);

      // Header background
      doc.setFillColor(...DARK);
      doc.rect(0, 0, pageW, headerH, 'F');

      // DKR GROUP text
      doc.setFont(FONT, 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...WHITE);
      doc.text('DKR GROUP', marginL, 12);

      // Right side
      doc.setFont(FONT, 'normal');
      doc.setFontSize(8);
      doc.text(d.header.date, pageW - marginR, 8, { align: 'right' });
      doc.setFontSize(9);
      doc.text('Коммерческое предложение', pageW - marginR, 13, { align: 'right' });

      // Blue accent line
      doc.setDrawColor(...BLUE);
      doc.setLineWidth(0.8);
      doc.line(0, headerH, pageW, headerH);

      // Footer
      doc.setDrawColor(...BLUE);
      doc.setLineWidth(0.3);
      doc.line(marginL, pageH - footerH, pageW - marginR, pageH - footerH);

      doc.setFont(FONT, 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      doc.text('DKR Group  |  dkrgroup.ru  |  Конфиденциально', marginL, pageH - 6);
      doc.text(`${i} / ${pages}`, pageW - marginR, pageH - 6, { align: 'right' });
    }
    // Reset to last page content state
    doc.setPage(pages);
    doc.setTextColor(...TEXT);
  }

  function checkPage(needed: number) {
    if (y + needed > pageH - footerH - 4) {
      doc.addPage();
      y = headerH + 6;
    }
  }

  function sectionTitle(title: string) {
    checkPage(14);
    y += 3;
    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.4);
    doc.line(marginL, y - 1, marginL + 40, y - 1);
    doc.setFontSize(12);
    doc.setFont(FONT, 'bold');
    doc.setTextColor(...BLUE);
    doc.text(title, marginL, y + 4);
    doc.setTextColor(...TEXT);
    y += 9;
  }

  function simpleTable(rows: (string | number)[][]) {
    autoTable(doc, {
      startY: y,
      margin: { left: marginL, right: marginR },
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2, font: FONT, textColor: TEXT },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'normal', textColor: MUTED },
        1: { cellWidth: contentW - 55, fontStyle: 'bold' },
      },
      body: rows.map((r) => [String(r[0]), String(r[1])]),
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 2;
  }

  function priceTable(heading: string, items: PostRow[]) {
    if (items.length === 0) return;
    checkPage(10 + items.length * 6);
    doc.setFontSize(9);
    doc.setFont(FONT, 'bold');
    doc.setTextColor(...DARK);
    doc.text(heading, marginL + 2, y);
    doc.setTextColor(...TEXT);
    y += 1;

    autoTable(doc, {
      startY: y,
      margin: { left: marginL + 2, right: marginR },
      theme: 'striped',
      styles: { fontSize: 8.5, cellPadding: 2, font: FONT, textColor: TEXT },
      headStyles: { fillColor: BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: STRIPE },
      columnStyles: {
        0: { cellWidth: contentW - 42 },
        1: { cellWidth: 40, halign: 'right' },
      },
      head: [['Наименование', 'Цена']],
      body: items.map((r) => [r.name, fmt(r.price)]),
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 3;
  }

  function subtotalLine(label: string, value: number) {
    checkPage(8);
    doc.setFontSize(10);
    doc.setFont(FONT, 'bold');
    doc.setTextColor(...BLUE);
    doc.text(label, marginL + 2, y);
    doc.text(fmt(value), pageW - marginR, y, { align: 'right' });
    doc.setTextColor(...TEXT);
    y += 7;
  }

  // ─── DOCUMENT TITLE ───
  const objectLabel = d.isTruck ? 'Грузовая мойка' : d.isRobot ? 'Роботизированная мойка' : 'Мойка самообслуживания';
  doc.setFontSize(18);
  doc.setFont(FONT, 'bold');
  doc.setTextColor(...DARK);
  doc.text('Коммерческое предложение', pageW / 2, y, { align: 'center' });
  y += 7;
  doc.setFontSize(11);
  doc.setFont(FONT, 'normal');
  doc.setTextColor(...BLUE);
  doc.text(objectLabel, pageW / 2, y, { align: 'center' });
  doc.setTextColor(...TEXT);
  y += 8;

  // ─── CLIENT INFO ───
  simpleTable([
    ['Дата', d.header.date],
    ['Менеджер', d.header.manager],
    ['Клиент', d.header.client],
    ['Тип транспорта', d.header.vehicleType],
    ['Тип объекта', d.header.objectType],
    ['Регион доставки', d.header.region],
  ]);

  // ─── TRUCK, ROBOT, or POSTS ───
  if (d.isTruck && d.truck) {
    sectionTitle('Грузовая мойка');
    checkPage(12);
    doc.setFontSize(9);
    doc.setFont(FONT, 'normal');
    doc.text(`Тип: ${d.truck.typeName} — ${fmt(d.truck.typePrice)}`, marginL + 2, y);
    y += 5;

    priceTable('Опции', d.truck.options);
    priceTable('Ручной пост', d.truck.manualPost);
    if (d.truck.manualPostMontage > 0) {
      checkPage(6);
      doc.setFontSize(9);
      doc.setFont(FONT, 'normal');
      doc.text(`Монтаж ручного поста: ${fmt(d.truck.manualPostMontage)}`, marginL + 2, y);
      y += 5;
    }
    if (d.truck.waterPrice > 0) {
      checkPage(6);
      doc.setFontSize(9);
      doc.setFont(FONT, 'normal');
      doc.text(`Водоочистка: ${d.truck.waterLabel} — ${fmt(d.truck.waterPrice)}`, marginL + 2, y);
      y += 5;
    }
    subtotalLine('Итого грузовая мойка:', d.truck.truckTotal);
  } else if (d.isRobot && d.robot) {
    sectionTitle('Робот');
    checkPage(12);
    doc.setFontSize(9);
    doc.setFont(FONT, 'normal');
    doc.text(`Модель: ${d.robot.modelName} — ${fmt(d.robot.modelPrice)}`, marginL + 2, y);
    y += 5;
    doc.text(`БУР: ${d.robot.burName} — ${fmt(d.robot.burPrice)}`, marginL + 2, y);
    y += 5;

    priceTable('Опции робота', d.robot.options);
    subtotalLine('Итого робот:', d.robot.robotTotal);
  } else {
    d.posts.forEach((post) => {
      sectionTitle(post.title);

      checkPage(15);
      doc.setFontSize(9);
      doc.setFont(FONT, 'normal');
      doc.text(`Профиль: ${post.profileName}`, marginL + 2, y);
      y += 5;
      doc.text(`Базовая комплектация: ${fmt(post.basePrice)}`, marginL + 2, y);
      y += 5;
      doc.text(`Терминал: ${post.bumName}${post.bumPrice > 0 ? ' — доплата ' + fmt(post.bumPrice) : ' (в комплекте)'}`, marginL + 2, y);
      y += 5;

      priceTable('Системы оплаты', post.payments.filter((p) => p.price > 0));
      priceTable('Аксессуары', post.accessories);
      priceTable('Функции', post.functions);
      priceTable('Помпы (АВД)', post.pumps);

      const extrasWithPump = [...post.postExtras];
      if (post.secondPump) extrasWithPump.push(post.secondPump);
      priceTable('Доп. оборудование к посту', extrasWithPump);

      subtotalLine(`Итого по посту:`, post.postTotal);
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
        styles: { fontSize: 8.5, cellPadding: 2, font: FONT, textColor: TEXT },
        headStyles: { fillColor: BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: STRIPE },
        columnStyles: {
          0: { cellWidth: contentW - 40 },
          1: { cellWidth: 40, halign: 'right' },
        },
        head: [['Наименование', 'Цена']],
        body: washRows.map((r) => [r.name, fmt(r.price)]),
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 3;
    }

    subtotalLine('Итого на мойку:', d.wash.washTotal);
  }

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
    styles: { fontSize: 9.5, cellPadding: 2.5, font: FONT, textColor: TEXT },
    columnStyles: {
      0: { cellWidth: contentW - 50, fontStyle: 'normal' },
      1: { cellWidth: 50, halign: 'right', fontStyle: 'bold' },
    },
    body: totalsRows,
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

  // ─── TOTAL BANNER ───
  checkPage(20);
  doc.setFillColor(...BLUE);
  doc.roundedRect(marginL, y, contentW, 14, 2, 2, 'F');
  doc.setFont(FONT, 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...WHITE);
  doc.text('ИТОГО:', marginL + 6, y + 9);
  doc.setFontSize(14);
  doc.text(fmt(d.totals.total), pageW - marginR - 6, y + 9, { align: 'right' });
  doc.setTextColor(...TEXT);
  y += 20;

  // ─── CONDITIONS ───
  if (d.deliveryConditions !== '—' || d.paymentConditions !== '—') {
    sectionTitle('Условия');
    doc.setFontSize(9);
    doc.setFont(FONT, 'normal');

    if (d.deliveryConditions !== '—') {
      doc.setFont(FONT, 'bold');
      doc.text('Условия доставки:', marginL, y);
      doc.setFont(FONT, 'normal');
      y += 4;
      const lines = doc.splitTextToSize(d.deliveryConditions, contentW - 4);
      doc.text(lines, marginL + 2, y);
      y += lines.length * 4 + 4;
    }

    if (d.paymentConditions !== '—') {
      checkPage(10);
      doc.setFont(FONT, 'bold');
      doc.text('Условия оплаты:', marginL, y);
      doc.setFont(FONT, 'normal');
      y += 4;
      const lines = doc.splitTextToSize(d.paymentConditions, contentW - 4);
      doc.text(lines, marginL + 2, y);
      y += lines.length * 4 + 4;
    }
  }

  // Draw header/footer on all pages (done last so page count is correct)
  drawHeaderFooter();

  const fileName = makeFileName(state, 'pdf');
  doc.save(fileName);
}
