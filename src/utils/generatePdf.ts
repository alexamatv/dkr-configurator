import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { WizardState } from '@/types';
import { gatherDocData, makeFileName, type PostRow } from './gatherData';
import { robotoRegular } from '../fonts/roboto-regular';
import { robotoBold } from '../fonts/roboto-bold';
import { DKR_LOGO_BASE64 } from '../fonts/dkr-logo';

const DARK: [number, number, number] = [30, 41, 59];
const BLUE: [number, number, number] = [14, 165, 233];
const MUTED: [number, number, number] = [107, 114, 128];
const SUBTLE: [number, number, number] = [55, 65, 81];
const FOOTER_GRAY: [number, number, number] = [156, 163, 175];
const LINE: [number, number, number] = [226, 232, 240];
const BLOCK_BG: [number, number, number] = [248, 250, 252];

function fmt(n: number): string {
  return n.toLocaleString('ru-RU') + ' \u20BD';
}

function fmtPrice(n: number): string {
  if (n === 0) return '\u0412 \u043A\u043E\u043C\u043F\u043B\u0435\u043A\u0442\u0435';
  return fmt(n);
}

function getLastY(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

export function generatePdf(state: WizardState): void {
  const d = gatherDocData(state);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

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
  const botY = pageH - 20;
  const dateStr = d.header.date;
  let y = 30;
  let headerFooterInstalled = false;

  function checkPage(needed: number) {
    if (y + needed > botY) {
      doc.addPage();
      y = 30;
    }
  }

  // didDrawPage callback for autoTable — draws header + footer on every page
  function getDidDrawPage() {
    if (headerFooterInstalled) return undefined;
    headerFooterInstalled = true;
    return () => {
      const pages = doc.getNumberOfPages();
      for (let p = 1; p <= pages; p++) {
        doc.setPage(p);
        // Header
        doc.addImage('data:image/png;base64,' + DKR_LOGO_BASE64, 'PNG', 14, 10, 45, 10);
        doc.setFont(F, 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...MUTED);
        doc.text(dateStr, pageW - mR, 16, { align: 'right' });
        doc.setDrawColor(...LINE);
        doc.setLineWidth(0.3);
        doc.line(mL, 24, pageW - mR, 24);
        // Footer
        doc.setDrawColor(...LINE);
        doc.setLineWidth(0.3);
        doc.line(mL, pageH - 12, pageW - mR, pageH - 12);
        doc.setFont(F, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...FOOTER_GRAY);
        doc.text('DKR Group \u00B7 dkrgroup.ru', mL, pageH - 8);
        doc.text(`\u0421\u0442\u0440. ${p} \u0438\u0437 ${pages}`, pageW - mR, pageH - 8, { align: 'right' });
      }
      doc.setPage(pages);
      doc.setTextColor(...DARK);
    };
  }

  // Draw header/footer on all pages (called at the very end)
  function drawHeaderFooter() {
    const pages = doc.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p);
      doc.addImage('data:image/png;base64,' + DKR_LOGO_BASE64, 'PNG', 14, 10, 45, 10);
      doc.setFont(F, 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text(dateStr, pageW - mR, 16, { align: 'right' });
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.3);
      doc.line(mL, 24, pageW - mR, 24);
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.3);
      doc.line(mL, pageH - 12, pageW - mR, pageH - 12);
      doc.setFont(F, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...FOOTER_GRAY);
      doc.text('DKR Group \u00B7 dkrgroup.ru', mL, pageH - 8);
      doc.text(`\u0421\u0442\u0440. ${p} \u0438\u0437 ${pages}`, pageW - mR, pageH - 8, { align: 'right' });
    }
    doc.setPage(pages);
    doc.setTextColor(...DARK);
  }

  // ─── Section heading (12pt for post titles, 11pt for subsections) ───
  function sectionHeading(title: string, size: number) {
    checkPage(14);
    y += 8;
    doc.setFontSize(size);
    doc.setFont(F, 'bold');
    doc.setTextColor(...DARK);
    doc.text(title, mL, y);
    y += 2;
  }

  // ─── Subsection heading (11pt) + table ───
  function priceTable(heading: string, items: PostRow[]) {
    if (items.length === 0) return;
    checkPage(12 + items.length * 6);

    doc.setFontSize(11);
    doc.setFont(F, 'bold');
    doc.setTextColor(...DARK);
    doc.text(heading, mL, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      margin: { top: 30, left: mL, right: mR },
      theme: 'plain',
      styles: {
        font: F,
        fontSize: 9,
        textColor: DARK,
        cellPadding: { top: 2, bottom: 2, left: 4, right: 4 },
      },
      headStyles: {
        fillColor: BLOCK_BG,
        textColor: MUTED,
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 },
      },
      bodyStyles: {
        textColor: DARK,
        fontSize: 9,
        cellPadding: { top: 2, bottom: 2, left: 4, right: 4 },
      },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 45, halign: 'right' },
      },
      tableLineColor: LINE,
      tableLineWidth: 0.2,
      head: [['\u041D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435', '\u0421\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C']],
      body: items.map((r) => [r.name, fmtPrice(r.price)]),
      didParseCell: (data) => {
        data.cell.styles.lineWidth = { bottom: 0.2, top: 0, left: 0, right: 0 } as unknown as number;
        data.cell.styles.lineColor = LINE;
      },
      didDrawPage: getDidDrawPage(),
    });
    y = getLastY(doc) + 6;
  }

  // ─── Subtotal line ───
  function subtotalLine(label: string, value: number) {
    checkPage(10);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(mL, y, pageW - mR, y);
    y += 5;
    doc.setFontSize(10);
    doc.setFont(F, 'bold');
    doc.setTextColor(...DARK);
    doc.text(label, mL, y);
    doc.setTextColor(...BLUE);
    doc.text(fmt(value), pageW - mR, y, { align: 'right' });
    doc.setTextColor(...DARK);
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
  // PAGE 1: TITLE
  // ═══════════════════════════════════════════════

  y = 32;
  doc.setFontSize(14);
  doc.setFont(F, 'bold');
  doc.setTextColor(...DARK);
  doc.text('\u041A\u041E\u041C\u041C\u0415\u0420\u0427\u0415\u0421\u041A\u041E\u0415 \u041F\u0420\u0415\u0414\u041B\u041E\u0416\u0415\u041D\u0418\u0415', pageW / 2, y, { align: 'center' });
  y += 6;

  const objectLabel = d.isTruck ? '\u0413\u0440\u0443\u0437\u043E\u0432\u0430\u044F \u043C\u043E\u0439\u043A\u0430' : d.isRobot ? '\u0420\u043E\u0431\u043E\u0442\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u0430\u044F \u043C\u043E\u0439\u043A\u0430' : '\u041C\u043E\u0439\u043A\u0430 \u0441\u0430\u043C\u043E\u043E\u0431\u0441\u043B\u0443\u0436\u0438\u0432\u0430\u043D\u0438\u044F';
  doc.setFontSize(10);
  doc.setFont(F, 'normal');
  doc.setTextColor(...MUTED);
  doc.text(objectLabel, pageW / 2, y, { align: 'center' });
  doc.setTextColor(...DARK);
  y += 8;

  // ═══════════════════════════════════════════════
  // INFO BLOCK (plain text, no autoTable)
  // ═══════════════════════════════════════════════

  const valOrDash = (v: string) => v || '\u2014';
  const infoLabelX = mL;
  const infoValX = mL + 42;
  const infoRightLabelX = pageW / 2 + 4;
  const infoRightValX = pageW / 2 + 42;

  // Row 1: Клиент + Менеджер
  doc.setFontSize(9);
  doc.setFont(F, 'normal');
  doc.setTextColor(...MUTED);
  doc.text('\u041A\u043B\u0438\u0435\u043D\u0442:', infoLabelX, y);
  doc.setFont(F, 'bold');
  doc.setTextColor(...DARK);
  doc.text(valOrDash(d.header.client), infoValX, y);
  doc.setFont(F, 'normal');
  doc.setTextColor(...MUTED);
  doc.text('\u041C\u0435\u043D\u0435\u0434\u0436\u0435\u0440:', infoRightLabelX, y);
  doc.setFont(F, 'bold');
  doc.setTextColor(...DARK);
  doc.text(valOrDash(d.header.manager), infoRightValX, y);
  y += 6;

  // Row 2: Тип транспорта
  doc.setFont(F, 'normal');
  doc.setTextColor(...MUTED);
  doc.text('\u0422\u0438\u043F \u0442\u0440\u0430\u043D\u0441\u043F\u043E\u0440\u0442\u0430:', infoLabelX, y);
  doc.setFont(F, 'bold');
  doc.setTextColor(...DARK);
  doc.text(valOrDash(d.header.vehicleType), infoValX, y);
  y += 6;

  // Row 3: Регион доставки
  doc.setFont(F, 'normal');
  doc.setTextColor(...MUTED);
  doc.text('\u0420\u0435\u0433\u0438\u043E\u043D \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0438:', infoLabelX, y);
  doc.setFont(F, 'bold');
  doc.setTextColor(...DARK);
  doc.text(valOrDash(d.header.region), infoValX, y);
  y += 4;

  // Separator
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(mL, y, pageW - mR, y);
  y += 6;

  // ═══════════════════════════════════════════════
  // CONTENT: TRUCK / ROBOT / MSO
  // ═══════════════════════════════════════════════

  if (d.isTruck && d.truck) {
    sectionHeading('\u0413\u0440\u0443\u0437\u043E\u0432\u0430\u044F \u043C\u043E\u0439\u043A\u0430', 12);
    priceTable('\u041E\u0441\u043D\u043E\u0432\u043D\u043E\u0435 \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435', [
      { name: d.truck.typeName, price: d.truck.typePrice },
    ]);
    priceTable('\u041E\u043F\u0446\u0438\u0438', d.truck.options);
    if (d.truck.manualPost.length > 0) {
      priceTable('\u0420\u0443\u0447\u043D\u043E\u0439 \u043F\u043E\u0441\u0442', d.truck.manualPost);
      if (d.truck.manualPostMontage > 0) {
        textLine(`\u041C\u043E\u043D\u0442\u0430\u0436 \u0440\u0443\u0447\u043D\u043E\u0433\u043E \u043F\u043E\u0441\u0442\u0430: ${fmt(d.truck.manualPostMontage)}`);
      }
    }
    if (d.truck.waterPrice > 0) {
      priceTable('\u0412\u043E\u0434\u043E\u043E\u0447\u0438\u0441\u0442\u043A\u0430', [
        { name: d.truck.waterLabel, price: d.truck.waterPrice },
      ]);
    }
    subtotalLine('\u0418\u0442\u043E\u0433\u043E \u0433\u0440\u0443\u0437\u043E\u0432\u0430\u044F \u043C\u043E\u0439\u043A\u0430:', d.truck.truckTotal);

  } else if (d.isRobot && d.robot) {
    sectionHeading('\u0420\u043E\u0431\u043E\u0442', 12);
    priceTable('\u041E\u0441\u043D\u043E\u0432\u043D\u043E\u0435 \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435', [
      { name: d.robot.modelName, price: d.robot.modelPrice },
      { name: `\u0411\u0423\u0420: ${d.robot.burName}`, price: d.robot.burPrice },
    ]);
    priceTable('\u041E\u043F\u0446\u0438\u0438 \u0440\u043E\u0431\u043E\u0442\u0430', d.robot.options);
    subtotalLine('\u0418\u0442\u043E\u0433\u043E \u0440\u043E\u0431\u043E\u0442:', d.robot.robotTotal);

  } else {
    d.posts.forEach((post) => {
      sectionHeading(post.title, 12);

      const baseRows: PostRow[] = [
        { name: `\u0411\u0430\u0437\u043E\u0432\u0430\u044F \u043A\u043E\u043C\u043F\u043B\u0435\u043A\u0442\u0430\u0446\u0438\u044F (${post.profileName})`, price: post.basePrice },
      ];
      if (post.bumPrice > 0) {
        baseRows.push({ name: `\u0422\u0435\u0440\u043C\u0438\u043D\u0430\u043B: ${post.bumName} (\u0434\u043E\u043F\u043B\u0430\u0442\u0430)`, price: post.bumPrice });
      } else {
        baseRows.push({ name: `\u0422\u0435\u0440\u043C\u0438\u043D\u0430\u043B: ${post.bumName} (\u0432 \u043A\u043E\u043C\u043F\u043B\u0435\u043A\u0442\u0435)`, price: 0 });
      }
      priceTable('\u041E\u0441\u043D\u043E\u0432\u043D\u043E\u0435 \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435', baseRows);

      priceTable('\u0421\u0438\u0441\u0442\u0435\u043C\u044B \u043E\u043F\u043B\u0430\u0442\u044B', post.payments);
      priceTable('\u0410\u043A\u0441\u0435\u0441\u0441\u0443\u0430\u0440\u044B', post.accessories);

      if (post.baseFunctions.length > 0) {
        textLine(`\u0411\u0430\u0437\u043E\u0432\u044B\u0435 \u0444\u0443\u043D\u043A\u0446\u0438\u0438: ${post.baseFunctions.map((f) => f.name).join(', ')} (\u0432\u0445\u043E\u0434\u044F\u0442 \u0432 \u043A\u043E\u043C\u043F\u043B\u0435\u043A\u0442)`);
      }

      priceTable('\u0424\u0443\u043D\u043A\u0446\u0438\u0438 \u043C\u043E\u0439\u043A\u0438', post.functions);
      priceTable('\u0410\u0412\u0414 (\u043F\u043E\u043C\u043F\u044B)', post.pumps);

      const extrasWithPump = [...post.postExtras];
      if (post.secondPump) extrasWithPump.push(post.secondPump);
      priceTable('\u0414\u043E\u043F. \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435 \u043A \u043F\u043E\u0441\u0442\u0443', extrasWithPump);

      subtotalLine('\u0418\u0442\u043E\u0433\u043E \u043F\u043E \u043F\u043E\u0441\u0442\u0443:', post.postTotal);
    });
  }

  // ═══════════════════════════════════════════════
  // WASH (skip for truck)
  // ═══════════════════════════════════════════════

  if (!d.isTruck) {
    sectionHeading('\u041E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435 \u043D\u0430 \u043C\u043E\u0439\u043A\u0443', 12);

    if (d.wash.waterRows.length > 0) {
      priceTable('\u0412\u043E\u0434\u043E\u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0430', d.wash.waterRows);
    }
    if (d.wash.vacuumPrice > 0) {
      priceTable('\u041F\u044B\u043B\u0435\u0441\u043E\u0441\u044B', [{ name: d.wash.vacuumLabel, price: d.wash.vacuumPrice }]);
    }
    if (d.wash.extras.length > 0) {
      priceTable('\u0414\u043E\u043F. \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435 \u043C\u043E\u0439\u043A\u0438', d.wash.extras);
    }

    const pipRows: PostRow[] = [];
    if (d.wash.pipelines.air > 0) pipRows.push({ name: '\u041C\u0430\u0433\u0438\u0441\u0442\u0440\u0430\u043B\u0438 \u0432\u043E\u0437\u0434\u0443\u0448\u043D\u044B\u0435', price: d.wash.pipelines.air });
    if (d.wash.pipelines.water > 0) pipRows.push({ name: '\u041C\u0430\u0433\u0438\u0441\u0442\u0440\u0430\u043B\u0438 \u0432\u043E\u0434\u043D\u044B\u0435', price: d.wash.pipelines.water });
    if (d.wash.pipelines.chem > 0) pipRows.push({ name: '\u041C\u0430\u0433\u0438\u0441\u0442\u0440\u0430\u043B\u0438 \u0445\u0438\u043C\u0438\u0447\u0435\u0441\u043A\u0438\u0435', price: d.wash.pipelines.chem });
    if (pipRows.length > 0) {
      priceTable('\u041C\u0430\u0433\u0438\u0441\u0442\u0440\u0430\u043B\u0438', pipRows);
    }

    subtotalLine('\u0418\u0442\u043E\u0433\u043E \u043D\u0430 \u043C\u043E\u0439\u043A\u0443:', d.wash.washTotal);
  }

  // ═══════════════════════════════════════════════
  // TOTALS BLOCK
  // ═══════════════════════════════════════════════

  const totalsRows: { label: string; value: string }[] = [];
  totalsRows.push({ label: '\u0418\u0442\u043E\u0433\u043E \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435', value: fmt(d.totals.subtotal) });

  if (d.totals.discountAmount > 0) {
    totalsRows.push({ label: `\u0421\u043A\u0438\u0434\u043A\u0430 ${d.totals.discountPct}%`, value: `\u2212 ${fmt(d.totals.discountAmount)}` });
  }
  if (d.totals.montageType !== 'none' && d.totals.montageAmount > 0) {
    totalsRows.push({ label: `\u041C\u043E\u043D\u0442\u0430\u0436 (${d.totals.montageType})`, value: fmt(d.totals.montageFromSubtotal) });
    if (d.totals.montageExtra > 0) {
      totalsRows.push({ label: '\u0414\u043E\u043F. \u0440\u0430\u0431\u043E\u0442\u044B \u043F\u043E \u043C\u043E\u043D\u0442\u0430\u0436\u0443', value: fmt(d.totals.montageExtra) });
    }
  }
  if (d.totals.vatEnabled) {
    totalsRows.push({ label: `\u041D\u0414\u0421 ${d.totals.vatPct}%`, value: fmt(d.totals.vatAmount) });
  }

  const lineH = 6.5;
  const blockPad = 8;
  const blockH = blockPad * 2 + totalsRows.length * lineH + 4 + lineH;
  checkPage(blockH + 8);

  y += 4;
  doc.setFillColor(...BLOCK_BG);
  doc.roundedRect(mL, y, cW, blockH, 3, 3, 'F');

  let by = y + blockPad;
  doc.setFontSize(10);

  totalsRows.forEach((row, i) => {
    doc.setFont(F, 'normal');
    doc.setTextColor(...SUBTLE);
    doc.text(row.label, mL + blockPad, by);
    doc.text(row.value, mL + cW - blockPad, by, { align: 'right' });
    by += lineH;
    if (i < totalsRows.length - 1) {
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.15);
      doc.line(mL + blockPad, by - 2.5, mL + cW - blockPad, by - 2.5);
    }
  });

  // Bold blue separator
  by += 2;
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(1.5);
  doc.line(mL + blockPad, by - 2, mL + cW - blockPad, by - 2);

  // ИТОГО
  doc.setFontSize(14);
  doc.setFont(F, 'bold');
  doc.setTextColor(...BLUE);
  doc.text('\u0418\u0422\u041E\u0413\u041E', mL + blockPad, by + 3);
  doc.text(fmt(d.totals.total), mL + cW - blockPad, by + 3, { align: 'right' });

  y = y + blockH + 8;
  doc.setTextColor(...DARK);

  // ═══════════════════════════════════════════════
  // CONDITIONS
  // ═══════════════════════════════════════════════

  if (d.deliveryConditions !== '\u2014' || d.paymentConditions !== '\u2014') {
    sectionHeading('\u0423\u0441\u043B\u043E\u0432\u0438\u044F', 11);
    doc.setFontSize(9);

    if (d.deliveryConditions !== '\u2014') {
      doc.setFont(F, 'bold');
      doc.setTextColor(...DARK);
      doc.text('\u0423\u0441\u043B\u043E\u0432\u0438\u044F \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0438:', mL, y);
      doc.setFont(F, 'normal');
      y += 4;
      const lines = doc.splitTextToSize(d.deliveryConditions, cW - 4);
      doc.text(lines, mL + 2, y);
      y += lines.length * 4 + 4;
    }

    if (d.paymentConditions !== '\u2014') {
      checkPage(12);
      doc.setFont(F, 'bold');
      doc.setTextColor(...DARK);
      doc.text('\u0423\u0441\u043B\u043E\u0432\u0438\u044F \u043E\u043F\u043B\u0430\u0442\u044B:', mL, y);
      doc.setFont(F, 'normal');
      y += 4;
      const lines = doc.splitTextToSize(d.paymentConditions, cW - 4);
      doc.text(lines, mL + 2, y);
      y += lines.length * 4 + 4;
    }
  }

  // Draw header/footer on all pages (last, so total page count is correct)
  drawHeaderFooter();

  doc.save(makeFileName(state, 'pdf'));
}
