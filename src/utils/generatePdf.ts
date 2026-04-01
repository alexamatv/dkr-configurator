import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { WizardState } from '@/types';
import { gatherDocData, makeFileName, type PostRow } from './gatherData';
import { robotoRegular } from '../fonts/roboto-regular';
import { robotoBold } from '../fonts/roboto-bold';

// ─── Brand colors (RGB tuples) ───
const BLUE: [number, number, number] = [14, 165, 233];
const DARK: [number, number, number] = [30, 41, 59];
const TEXT: [number, number, number] = [17, 24, 39];
const MUTED: [number, number, number] = [100, 116, 139];
const LINE: [number, number, number] = [229, 231, 235]; // #E5E7EB
const STRIPE: [number, number, number] = [249, 250, 251]; // #F9FAFB

function fmt(n: number): string {
  return n.toLocaleString('ru-RU') + ' \u20BD';
}

function getLastY(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

export function generatePdf(state: WizardState): void {
  const d = gatherDocData(state);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Register Roboto
  doc.addFileToVFS('Roboto-Regular.ttf', robotoRegular);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFileToVFS('Roboto-Bold.ttf', robotoBold);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
  doc.setFont('Roboto');

  const F = 'Roboto';
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const mL = 20;
  const mR = 20;
  const cW = pageW - mL - mR;
  const topY = 15;
  const botY = pageH - 15;
  let y = topY;

  // ─── Utility: page break ───
  function checkPage(needed: number) {
    if (y + needed > botY - 8) {
      doc.addPage();
      y = topY + 14; // leave room for header on new pages
    }
  }

  // ─── Draw logo (drop circle + text) ───
  function drawLogo(x: number, yPos: number) {
    // Blue drop/circle
    doc.setFillColor(...BLUE);
    doc.circle(x + 3, yPos - 2, 3, 'F');
    // Small white highlight
    doc.setFillColor(255, 255, 255);
    doc.circle(x + 2.2, yPos - 3, 0.8, 'F');
    // Text
    doc.setFont(F, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text('DKR GROUP', x + 8, yPos);
  }

  // ─── Header/footer on all pages (called last) ───
  function drawHeaderFooter() {
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      // Logo top-right
      drawLogo(pageW - mR - 38, 10);
      // Footer line
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.3);
      doc.line(mL, pageH - 12, pageW - mR, pageH - 12);
      // Footer text
      doc.setFont(F, 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      doc.text('DKR Group  |  dkrgroup.ru', mL, pageH - 8);
      doc.text(`${i} / ${pages}`, pageW - mR, pageH - 8, { align: 'right' });
    }
    doc.setPage(pages);
    doc.setTextColor(...TEXT);
  }

  // ─── Section title: bold dark + thin blue underline ───
  function sectionTitle(title: string) {
    checkPage(16);
    y += 5;
    doc.setFontSize(12);
    doc.setFont(F, 'bold');
    doc.setTextColor(...DARK);
    doc.text(title, mL, y);
    y += 2;
    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.4);
    doc.line(mL, y, mL + Math.min(doc.getTextWidth(title) + 4, cW), y);
    doc.setTextColor(...TEXT);
    y += 5;
  }

  // ─── Info table (label : value pairs, no borders) ───
  function infoTable(rows: [string, string][]) {
    autoTable(doc, {
      startY: y,
      margin: { left: mL, right: mR },
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: { top: 1.5, bottom: 1.5, left: 0, right: 4 }, font: F, textColor: TEXT },
      columnStyles: {
        0: { cellWidth: 50, textColor: MUTED },
        1: { cellWidth: cW - 50, fontStyle: 'bold' },
      },
      body: rows,
    });
    y = getLastY(doc) + 2;
  }

  // ─── Price table: thin gray horizontal lines, no vertical, blue header bottom border ───
  function priceTable(heading: string, items: PostRow[]) {
    if (items.length === 0) return;
    checkPage(10 + items.length * 6);

    doc.setFontSize(9);
    doc.setFont(F, 'bold');
    doc.setTextColor(...DARK);
    doc.text(heading, mL + 2, y);
    doc.setTextColor(...TEXT);
    y += 2;

    autoTable(doc, {
      startY: y,
      margin: { left: mL + 2, right: mR },
      theme: 'plain',
      styles: {
        fontSize: 8.5,
        cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
        font: F,
        textColor: TEXT,
        lineColor: LINE,
        lineWidth: 0,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: DARK,
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: STRIPE },
      columnStyles: {
        0: { cellWidth: cW - 44 },
        1: { cellWidth: 40, halign: 'right' },
      },
      head: [['Наименование', 'Цена']],
      body: items.map((r) => [r.name, fmt(r.price)]),
      didDrawCell: (data) => {
        // Draw thin gray bottom border on every cell
        const { cell, row } = data;
        doc.setDrawColor(...LINE);
        doc.setLineWidth(0.2);
        doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
        // Blue bottom border for head row
        if (row.section === 'head') {
          doc.setDrawColor(...BLUE);
          doc.setLineWidth(0.5);
          doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
        }
      },
    });
    y = getLastY(doc) + 3;
  }

  // ─── Subtotal line ───
  function subtotalLine(label: string, value: number) {
    checkPage(8);
    doc.setFontSize(10);
    doc.setFont(F, 'bold');
    doc.setTextColor(...BLUE);
    doc.text(label, mL + 2, y);
    doc.text(fmt(value), pageW - mR, y, { align: 'right' });
    doc.setTextColor(...TEXT);
    y += 7;
  }

  // ─── Inline text line ───
  function textLine(text: string, bold = false) {
    checkPage(6);
    doc.setFontSize(9);
    doc.setFont(F, bold ? 'bold' : 'normal');
    doc.text(text, mL + 2, y);
    y += 5;
  }

  // ═══════════════════════════════════════════════
  // PAGE 1: TITLE + CLIENT INFO
  // ═══════════════════════════════════════════════

  y = 24;
  // Title
  doc.setFontSize(18);
  doc.setFont(F, 'bold');
  doc.setTextColor(...DARK);
  doc.text('Коммерческое предложение', pageW / 2, y, { align: 'center' });
  y += 3;
  // Thin blue line under title
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.5);
  const titleW = doc.getTextWidth('Коммерческое предложение');
  doc.line((pageW - titleW) / 2, y, (pageW + titleW) / 2, y);
  y += 6;

  // Subtitle: object type
  const objectLabel = d.isTruck ? 'Грузовая мойка' : d.isRobot ? 'Роботизированная мойка' : 'Мойка самообслуживания';
  doc.setFontSize(11);
  doc.setFont(F, 'normal');
  doc.setTextColor(...MUTED);
  doc.text(objectLabel, pageW / 2, y, { align: 'center' });
  doc.setTextColor(...TEXT);
  y += 10;

  // Client info
  infoTable([
    ['Дата', d.header.date],
    ['Менеджер', d.header.manager],
    ['Клиент', d.header.client],
    ['Тип транспорта', d.header.vehicleType],
    ['Тип объекта', d.header.objectType],
    ['Регион доставки', d.header.region],
  ]);

  // ═══════════════════════════════════════════════
  // CONTENT: TRUCK / ROBOT / MSO
  // ═══════════════════════════════════════════════

  if (d.isTruck && d.truck) {
    sectionTitle('Грузовая мойка');
    textLine(`Тип: ${d.truck.typeName} — ${fmt(d.truck.typePrice)}`);
    priceTable('Опции', d.truck.options);
    priceTable('Ручной пост', d.truck.manualPost);
    if (d.truck.manualPostMontage > 0) {
      textLine(`Монтаж ручного поста: ${fmt(d.truck.manualPostMontage)}`);
    }
    if (d.truck.waterPrice > 0) {
      textLine(`Водоочистка: ${d.truck.waterLabel} — ${fmt(d.truck.waterPrice)}`);
    }
    subtotalLine('Итого грузовая мойка:', d.truck.truckTotal);

  } else if (d.isRobot && d.robot) {
    sectionTitle('Робот');
    textLine(`Модель: ${d.robot.modelName} — ${fmt(d.robot.modelPrice)}`);
    textLine(`БУР: ${d.robot.burName} — ${fmt(d.robot.burPrice)}`);
    priceTable('Опции робота', d.robot.options);
    subtotalLine('Итого робот:', d.robot.robotTotal);

  } else {
    d.posts.forEach((post) => {
      sectionTitle(post.title);
      textLine(`Профиль: ${post.profileName}`);
      textLine(`Базовая комплектация: ${fmt(post.basePrice)}`);
      textLine(`Терминал: ${post.bumName}${post.bumPrice > 0 ? ' — доплата ' + fmt(post.bumPrice) : ' (в комплекте)'}`);

      // Base functions as comma list
      if (post.baseFunctions.length > 0) {
        textLine(`Базовые функции: ${post.baseFunctions.map((f) => f.name).join(', ')} (входят в комплект)`);
      }

      priceTable('Системы оплаты', post.payments);
      priceTable('Аксессуары', post.accessories);
      priceTable('Функции', post.functions);
      priceTable('Помпы (АВД)', post.pumps);

      const extrasWithPump = [...post.postExtras];
      if (post.secondPump) extrasWithPump.push(post.secondPump);
      priceTable('Доп. оборудование к посту', extrasWithPump);

      subtotalLine('Итого по посту:', post.postTotal);
    });
  }

  // ═══════════════════════════════════════════════
  // WASH (skip for truck)
  // ═══════════════════════════════════════════════

  if (!d.isTruck) {
    sectionTitle('Оборудование на мойку');

    // Water rows as table
    if (d.wash.waterRows.length > 0) {
      priceTable('Водоподготовка', d.wash.waterRows);
    }

    if (d.wash.vacuumPrice > 0) {
      textLine(`Пылесосы: ${d.wash.vacuumLabel} — ${fmt(d.wash.vacuumPrice)}`);
    }

    if (d.wash.extras.length > 0) {
      priceTable('Другое оборудование', d.wash.extras);
    }

    const pipRows: PostRow[] = [];
    if (d.wash.pipelines.air > 0) pipRows.push({ name: 'Магистрали воздушные', price: d.wash.pipelines.air });
    if (d.wash.pipelines.water > 0) pipRows.push({ name: 'Магистрали водные', price: d.wash.pipelines.water });
    if (d.wash.pipelines.chem > 0) pipRows.push({ name: 'Магистрали химические', price: d.wash.pipelines.chem });
    if (pipRows.length > 0) {
      priceTable('Магистрали', pipRows);
    }

    subtotalLine('Итого на мойку:', d.wash.washTotal);
  }

  // ═══════════════════════════════════════════════
  // TOTALS
  // ═══════════════════════════════════════════════

  sectionTitle('Итоговый расчёт');

  const totalsRows: [string, string][] = [
    ['Стоимость оборудования', fmt(d.totals.subtotal)],
  ];

  if (d.totals.discountAmount > 0) {
    totalsRows.push([`Скидка (${d.totals.discountPct}%)`, `\u2212 ${fmt(d.totals.discountAmount)}`]);
    if (d.totals.discountWarning) {
      totalsRows.push(['', 'Требует согласования у руководства']);
    }
    totalsRows.push(['После скидки', fmt(d.totals.afterDiscount)]);
  }

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
    margin: { left: mL, right: mR },
    theme: 'plain',
    styles: { fontSize: 9.5, cellPadding: 2.5, font: F, textColor: TEXT },
    columnStyles: {
      0: { cellWidth: cW - 55 },
      1: { cellWidth: 55, halign: 'right', fontStyle: 'bold' },
    },
    body: totalsRows,
  });
  y = getLastY(doc) + 5;

  // ИТОГО — bold line + large text (no banner)
  checkPage(16);
  doc.setDrawColor(...DARK);
  doc.setLineWidth(0.5);
  doc.line(mL, y, pageW - mR, y);
  y += 7;
  doc.setFontSize(14);
  doc.setFont(F, 'bold');
  doc.setTextColor(...DARK);
  doc.text('ИТОГО:', mL, y);
  doc.setTextColor(...BLUE);
  doc.text(fmt(d.totals.total), pageW - mR, y, { align: 'right' });
  doc.setTextColor(...TEXT);
  y += 10;

  // ═══════════════════════════════════════════════
  // CONDITIONS
  // ═══════════════════════════════════════════════

  if (d.deliveryConditions !== '—' || d.paymentConditions !== '—') {
    sectionTitle('Условия');
    doc.setFontSize(9);

    if (d.deliveryConditions !== '—') {
      doc.setFont(F, 'bold');
      doc.text('Условия доставки:', mL, y);
      doc.setFont(F, 'normal');
      y += 4;
      const lines = doc.splitTextToSize(d.deliveryConditions, cW - 4);
      doc.text(lines, mL + 2, y);
      y += lines.length * 4 + 4;
    }

    if (d.paymentConditions !== '—') {
      checkPage(12);
      doc.setFont(F, 'bold');
      doc.text('Условия оплаты:', mL, y);
      doc.setFont(F, 'normal');
      y += 4;
      const lines = doc.splitTextToSize(d.paymentConditions, cW - 4);
      doc.text(lines, mL + 2, y);
      y += lines.length * 4 + 4;
    }
  }

  // Draw header/footer on all pages (last, so page count is correct)
  drawHeaderFooter();

  doc.save(makeFileName(state, 'pdf'));
}
