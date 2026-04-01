import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { WizardState } from '@/types';
import { gatherDocData, makeFileName, type PostRow } from './gatherData';
import { robotoRegular } from '../fonts/roboto-regular';
import { robotoBold } from '../fonts/roboto-bold';
import { DKR_LOGO_BASE64 } from '../fonts/dkr-logo';

// ─── Brand colors (RGB tuples) ───
const DARK: [number, number, number] = [30, 41, 59];       // #1E293B
const BLUE: [number, number, number] = [14, 165, 233];     // #0EA5E9
const TEXT: [number, number, number] = [30, 41, 59];        // #1E293B
const MUTED: [number, number, number] = [107, 114, 128];   // #6B7280
const SUBTLE: [number, number, number] = [55, 65, 81];     // #374151
const FOOTER_GRAY: [number, number, number] = [156, 163, 175]; // #9CA3AF
const LINE: [number, number, number] = [226, 232, 240];    // #E2E8F0
const HEAD_BG: [number, number, number] = [241, 245, 249]; // #F1F5F9
const STRIPE: [number, number, number] = [248, 250, 252];  // #F8FAFC
const BLOCK_BG: [number, number, number] = [241, 245, 249]; // #F1F5F9

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
  const mL = 14;
  const mR = 14;
  const cW = pageW - mL - mR;
  const botY = pageH - 18;
  let y = 30;

  // ─── Page break check ───
  function checkPage(needed: number) {
    if (y + needed > botY) {
      doc.addPage();
      y = 18;
    }
  }

  // ─── Header/footer on all pages (called last) ───
  function drawHeaderFooter() {
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      // Logo image left
      doc.addImage('data:image/jpeg;base64,' + DKR_LOGO_BASE64, 'JPEG', 14, 10, 45, 15);
      // Date right
      doc.setFont(F, 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text(d.header.date, pageW - mR, 18, { align: 'right' });
      // Thin line under header
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.5);
      doc.line(mL, 27, pageW - mR, 27);
      // Footer line
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.5);
      doc.line(mL, pageH - 14, pageW - mR, pageH - 14);
      // Footer text
      doc.setFont(F, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...FOOTER_GRAY);
      doc.text('DKR Group \u00B7 dkrgroup.ru', mL, pageH - 9);
      doc.text(`\u0421\u0442\u0440. ${i} \u0438\u0437 ${pages}`, pageW - mR, pageH - 9, { align: 'right' });
    }
    doc.setPage(pages);
    doc.setTextColor(...TEXT);
  }

  // ─── Section title: 11pt bold #1E293B + thin line #E2E8F0 ───
  function sectionTitle(title: string) {
    checkPage(16);
    y += 10;
    doc.setFontSize(11);
    doc.setFont(F, 'bold');
    doc.setTextColor(...DARK);
    doc.text(title, mL, y);
    y += 2;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(mL, y, pageW - mR, y);
    doc.setTextColor(...TEXT);
    y += 2;
  }

  // ─── Info table (label : value pairs) ───
  function infoTable(rows: [string, string][]) {
    autoTable(doc, {
      startY: y,
      margin: { left: mL, right: mR },
      theme: 'plain',
      styles: {
        font: F,
        fontSize: 10,
        cellPadding: { top: 1.8, bottom: 1.8, left: 0, right: 4 },
        textColor: TEXT,
        lineWidth: 0,
      },
      columnStyles: {
        0: { cellWidth: 50, fontSize: 9, textColor: MUTED },
        1: { cellWidth: cW - 50, fontStyle: 'bold' },
      },
      body: rows,
    });
    y = getLastY(doc) + 2;
  }

  // ─── Price table with professional styling ───
  function priceTable(heading: string, items: PostRow[]) {
    if (items.length === 0) return;
    checkPage(12 + items.length * 7);

    // Sub-heading
    doc.setFontSize(11);
    doc.setFont(F, 'bold');
    doc.setTextColor(...DARK);
    doc.text(heading, mL, y);
    y += 2;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(mL, y, pageW - mR, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      margin: { left: mL, right: mR },
      theme: 'plain',
      styles: {
        font: F,
        fontSize: 9,
        cellPadding: { top: 3, bottom: 3, left: 6, right: 6 },
        lineColor: [229, 231, 235],
        lineWidth: 0.3,
        textColor: TEXT,
      },
      headStyles: {
        fillColor: HEAD_BG,
        textColor: DARK,
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: { top: 4, bottom: 4, left: 6, right: 6 },
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: TEXT,
        fontSize: 9,
        cellPadding: { top: 3, bottom: 3, left: 6, right: 6 },
      },
      alternateRowStyles: {
        fillColor: STRIPE,
      },
      columnStyles: {
        0: { cellWidth: cW * 0.7 },
        1: { cellWidth: cW * 0.3, halign: 'right' },
      },
      tableLineColor: [229, 231, 235],
      tableLineWidth: 0,
      head: [['Наименование', 'Стоимость']],
      body: items.map((r) => [r.name, fmt(r.price)]),
      didParseCell: (data) => {
        data.cell.styles.lineWidth = { bottom: 0.3, top: 0, left: 0, right: 0 } as unknown as number;
      },
    });
    y = getLastY(doc) + 3;
  }

  // ─── Subtotal line with thin line above ───
  function subtotalLine(label: string, value: number) {
    checkPage(10);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(mL, y, pageW - mR, y);
    y += 5;
    doc.setFontSize(11);
    doc.setFont(F, 'bold');
    doc.setTextColor(...DARK);
    doc.text(label, mL, y);
    doc.setTextColor(...BLUE);
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

  y = 34;

  // Title centered
  doc.setFontSize(16);
  doc.setFont(F, 'bold');
  doc.setTextColor(...DARK);
  doc.text('\u041A\u041E\u041C\u041C\u0415\u0420\u0427\u0415\u0421\u041A\u041E\u0415 \u041F\u0420\u0415\u0414\u041B\u041E\u0416\u0415\u041D\u0418\u0415', pageW / 2, y, { align: 'center' });
  y += 6;

  // Subtitle: object type
  const objectLabel = d.isTruck ? 'Грузовая мойка' : d.isRobot ? 'Роботизированная мойка' : 'Мойка самообслуживания';
  doc.setFontSize(11);
  doc.setFont(F, 'normal');
  doc.setTextColor(...MUTED);
  doc.text(objectLabel, pageW / 2, y, { align: 'center' });
  doc.setTextColor(...TEXT);
  y += 12;

  // Client info
  infoTable([
    ['Дата', d.header.date],
    ['Менеджер', d.header.manager],
    ['Клиент', d.header.client],
    ['Тип транспорта', d.header.vehicleType],
    ['Регион доставки', d.header.region],
  ]);

  // ═══════════════════════════════════════════════
  // CONTENT: TRUCK / ROBOT / MSO
  // ═══════════════════════════════════════════════

  if (d.isTruck && d.truck) {
    sectionTitle('Грузовая мойка');
    priceTable('Основное оборудование', [
      { name: d.truck.typeName, price: d.truck.typePrice },
    ]);
    priceTable('Опции', d.truck.options);
    if (d.truck.manualPost.length > 0) {
      priceTable('Ручной пост', d.truck.manualPost);
      if (d.truck.manualPostMontage > 0) {
        textLine(`Монтаж ручного поста: ${fmt(d.truck.manualPostMontage)}`);
      }
    }
    if (d.truck.waterPrice > 0) {
      priceTable('Водоочистка', [
        { name: d.truck.waterLabel, price: d.truck.waterPrice },
      ]);
    }
    subtotalLine('Итого грузовая мойка:', d.truck.truckTotal);

  } else if (d.isRobot && d.robot) {
    sectionTitle('Робот');
    priceTable('Основное оборудование', [
      { name: d.robot.modelName, price: d.robot.modelPrice },
      { name: `БУР: ${d.robot.burName}`, price: d.robot.burPrice },
    ]);
    priceTable('Опции робота', d.robot.options);
    subtotalLine('Итого робот:', d.robot.robotTotal);

  } else {
    d.posts.forEach((post) => {
      sectionTitle(post.title);

      // Base equipment as table
      const baseRows: PostRow[] = [
        { name: `Базовая комплектация (${post.profileName})`, price: post.basePrice },
      ];
      if (post.bumPrice > 0) {
        baseRows.push({ name: `Терминал: ${post.bumName} (доплата)`, price: post.bumPrice });
      } else {
        baseRows.push({ name: `Терминал: ${post.bumName} (в комплекте)`, price: 0 });
      }
      priceTable('Основное оборудование', baseRows);

      priceTable('Системы оплаты', post.payments);
      priceTable('Аксессуары', post.accessories);

      if (post.baseFunctions.length > 0) {
        textLine(`Базовые функции: ${post.baseFunctions.map((f) => f.name).join(', ')} (входят в комплект)`);
      }

      priceTable('Функции мойки', post.functions);
      priceTable('АВД (помпы)', post.pumps);

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

    if (d.wash.waterRows.length > 0) {
      priceTable('Водоподготовка', d.wash.waterRows);
    }

    if (d.wash.vacuumPrice > 0) {
      priceTable('Пылесосы', [{ name: d.wash.vacuumLabel, price: d.wash.vacuumPrice }]);
    }

    if (d.wash.extras.length > 0) {
      priceTable('Доп. оборудование мойки', d.wash.extras);
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
  // TOTALS — block with background
  // ═══════════════════════════════════════════════

  y += 8;

  // Collect totals rows
  const totalsLines: { label: string; value: string; bold?: boolean }[] = [];
  totalsLines.push({ label: 'Итого оборудование', value: fmt(d.totals.subtotal) });

  if (d.totals.discountAmount > 0) {
    totalsLines.push({ label: `Скидка (${d.totals.discountPct}%)`, value: `\u2212 ${fmt(d.totals.discountAmount)}` });
    if (d.totals.discountWarning) {
      totalsLines.push({ label: '', value: '\u26A0 Требует согласования' });
    }
    totalsLines.push({ label: 'После скидки', value: fmt(d.totals.afterDiscount) });
  }

  if (d.totals.montageAmount > 0) {
    totalsLines.push({ label: `Монтаж (${d.totals.montageType})`, value: fmt(d.totals.montageFromSubtotal) });
    if (d.totals.montageExtra > 0) {
      totalsLines.push({ label: 'Доп. работы по монтажу', value: fmt(d.totals.montageExtra) });
    }
  } else {
    totalsLines.push({ label: 'Монтаж', value: 'Нет' });
  }

  if (d.totals.vatEnabled) {
    totalsLines.push({ label: `НДС (${d.totals.vatPct}%)`, value: fmt(d.totals.vatAmount) });
  } else {
    totalsLines.push({ label: 'НДС', value: 'Не применяется (Сколково)' });
  }

  const lineH = 6.5;
  const blockPad = 10;
  const blockH = blockPad * 2 + totalsLines.length * lineH + 2 + lineH + 4; // rows + separator + ИТОГО
  checkPage(blockH + 4);

  // Draw background block
  doc.setFillColor(...BLOCK_BG);
  doc.roundedRect(mL, y, cW, blockH, 3, 3, 'F');

  let by = y + blockPad;
  doc.setFontSize(10);

  totalsLines.forEach((line) => {
    doc.setFont(F, 'normal');
    doc.setTextColor(...SUBTLE);
    doc.text(line.label, mL + blockPad, by);
    doc.text(line.value, mL + cW - blockPad, by, { align: 'right' });
    by += lineH;
    // thin gray divider
    doc.setDrawColor(200, 205, 215);
    doc.setLineWidth(0.2);
    doc.line(mL + blockPad, by - 2.5, mL + cW - blockPad, by - 2.5);
  });

  // Bold blue line before ИТОГО
  by += 2;
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.8);
  doc.line(mL + blockPad, by - 2, mL + cW - blockPad, by - 2);

  // ИТОГО line
  doc.setFontSize(14);
  doc.setFont(F, 'bold');
  doc.setTextColor(...BLUE);
  doc.text('ИТОГО', mL + blockPad, by + 3);
  doc.text(fmt(d.totals.total), mL + cW - blockPad, by + 3, { align: 'right' });

  y = y + blockH + 8;
  doc.setTextColor(...TEXT);

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
