import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { WizardState } from '@/types';
import type { DataContextValue } from '@/context/DataContext';
import { gatherDocData, makeFileName, type PostRow, type PostBlock } from './gatherData';

export interface KpPhotoEmbed {
  label: string;
  price: number;
  data: string; // base64 data URL
  table: string;
  id: string;
}
import { robotoRegular } from '../fonts/roboto-regular';
import { robotoBold } from '../fonts/roboto-bold';
import { DKR_LOGO_BASE64 } from '../fonts/dkr-logo';

/* ─── Post grouping ─── */
interface PostGroup {
  post: PostBlock;
  count: number;
}

function groupPosts(posts: PostBlock[]): PostGroup[] {
  const groups: PostGroup[] = [];
  for (const post of posts) {
    const key = postFingerprint(post);
    const existing = groups.find((g) => postFingerprint(g.post) === key);
    if (existing) {
      existing.count++;
    } else {
      groups.push({ post, count: 1 });
    }
  }
  return groups;
}

function postFingerprint(p: PostBlock): string {
  const parts = [
    p.profileName,
    p.basePrice,
    p.bumName,
    p.bumPrice,
    p.payments.map((r) => r.name + ':' + r.price).join('|'),
    p.accessories.map((r) => r.name + ':' + r.price).join('|'),
    p.functions.map((r) => r.name + ':' + r.price).join('|'),
    p.pumps.map((r) => r.name + ':' + r.price).join('|'),
    p.postExtras.map((r) => r.name + ':' + r.price).join('|'),
    p.secondPump ? p.secondPump.name + ':' + p.secondPump.price : '',
    p.postVacuum ? p.postVacuum.name + ':' + p.postVacuum.price : '',
  ];
  return parts.join('//');
}

/* ─── Color palette ─── */
const DARK: [number, number, number] = [30, 41, 59];
const BLUE: [number, number, number] = [14, 165, 233];
const MUTED: [number, number, number] = [107, 114, 128];
const SUBTLE: [number, number, number] = [55, 65, 81];
const FOOTER_GRAY: [number, number, number] = [156, 163, 175];
const LINE: [number, number, number] = [226, 232, 240];
const BLOCK_BG: [number, number, number] = [248, 250, 252];

/* ─── Formatters ─── */
function fmt(n: number): string {
  return n.toLocaleString('ru-RU') + ' \u20BD';
}

function fmtPrice(n: number): string {
  if (n === 0) return 'В комплекте';
  // Anything ≤ 1 ₽ is a placeholder for "real price not yet set" (e.g. the
  // 2-постовой vacuum priced at 1). Show "Цена по запросу" so the КП
  // doesn't display a literal "1 ₽".
  if (n > 0 && n <= 1) return 'Цена по запросу';
  return fmt(n);
}

/* ─── Main export ─── */
export function generatePdf(
  state: WizardState,
  data: DataContextValue,
  photos: KpPhotoEmbed[] = [],
): void {
  const d = gatherDocData(state, data);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Register fonts
  doc.addFileToVFS('Roboto-Regular.ttf', robotoRegular);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFileToVFS('Roboto-Bold.ttf', robotoBold);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
  doc.setFont('Roboto');

  const F = 'Roboto';
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Lookup map for inline-photo placement, keyed by `${table}:${id}`.
  // Items consumed inline (e.g. БУМ next to kit list) are removed from
  // the appendix to avoid duplication. consume() never removes — multiple
  // post blocks can claim the same photo (two posts with the same BUM
  // both get the inline photo, the appendix is told it's already used).
  const photoByKey = new Map<string, KpPhotoEmbed>();
  for (const p of photos) photoByKey.set(`${p.table}:${p.id}`, p);
  const consumedKeys = new Set<string>();
  // eslint-disable-next-line no-console
  console.info(`[KP photos PDF] received ${photos.length} photo(s):`, photos.map((p) => `${p.table}:${p.id} → ${p.label}`));
  const consume = (table: string, id: string): KpPhotoEmbed | undefined => {
    const key = `${table}:${id}`;
    const photo = photoByKey.get(key);
    // eslint-disable-next-line no-console
    console.info(`[KP photos PDF] consume(${key}) → ${photo ? 'HIT (' + photo.label + ')' : 'MISS'}`);
    if (photo) consumedKeys.add(key);
    return photo;
  };
  const mL = 14;
  const mR = 14;
  const cW = pageW - mL - mR;
  const headerEnd = 26;
  const footerStart = pageH - 14;
  const dateStr = d.header.date;

  let y = headerEnd + 2;

  /* ─── Page break check ─── */
  function checkPage(needed: number) {
    if (y + needed > footerStart) {
      doc.addPage();
      y = headerEnd + 4;
    }
  }

  /* ─── Draw header + footer on ONE page ─── */
  function drawHeaderFooterOnPage(pageNum: number, totalPages: number) {
    doc.setPage(pageNum);

    // Logo
    try {
      doc.addImage(
        'data:image/png;base64,' + DKR_LOGO_BASE64,
        'PNG', mL, 5, 50, 14
      );
    } catch {
      doc.setFontSize(14);
      doc.setFont(F, 'bold');
      doc.setTextColor(...BLUE);
      doc.text('DKR GROUP', mL, 16);
    }

    // Date top-right
    doc.setFont(F, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(dateStr, pageW - mR, 16, { align: 'right' });

    // Line under header
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(mL, 24, pageW - mR, 24);

    // Footer line
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(mL, footerStart, pageW - mR, footerStart);

    // Footer text
    doc.setFont(F, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...FOOTER_GRAY);
    doc.text('DKR Group \u00B7 dkrgroup.ru', mL, footerStart + 4);
    doc.text(
      '\u0421\u0442\u0440. ' + pageNum + ' \u0438\u0437 ' + totalPages,
      pageW - mR, footerStart + 4, { align: 'right' }
    );
  }

  /* ─── Draw all headers and footers at the end ─── */
  function drawAllHeadersFooters() {
    const total = doc.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
      drawHeaderFooterOnPage(p, total);
    }
    doc.setPage(total);
    doc.setTextColor(...DARK);
    doc.setFont(F, 'normal');
  }

  /* ─── Section title (big, with separator line above) ─── */
  function sectionTitle(title: string) {
    checkPage(16);
    y += 6;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(mL, y, pageW - mR, y);
    y += 7;
    doc.setFontSize(12);
    doc.setFont(F, 'bold');
    doc.setTextColor(...DARK);
    doc.text(title, mL, y);
    y += 4;
  }

  /* ─── Subsection heading + price table ─── */
  function priceTable(heading: string, items: PostRow[]) {
    if (items.length === 0) return;

    const estimatedH = 10 + items.length * 7;
    checkPage(estimatedH);

    y += 4;
    doc.setFontSize(10);
    doc.setFont(F, 'bold');
    doc.setTextColor(...DARK);
    doc.text(heading, mL, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      margin: { top: headerEnd + 4, left: mL, right: mR, bottom: pageH - footerStart + 4 },
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
        cellPadding: { top: 2, bottom: 2, left: 4, right: 4 },
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 42, halign: 'right' },
      },
      tableLineColor: LINE,
      tableLineWidth: 0.15,
      head: [['\u041D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435', '\u0421\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C']],
      body: items.map((r) => [r.name, fmtPrice(r.price)]),
      didParseCell: (data) => {
        data.cell.styles.lineWidth = {
          bottom: 0.15, top: 0, left: 0, right: 0,
        } as unknown as number;
        data.cell.styles.lineColor = LINE;
      },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 2;
  }

  /* ─── Subtotal line ─── */
  function subtotalLine(label: string, value: number) {
    checkPage(10);
    y += 2;
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
    y += 4;
  }

  /* ─── Inline text note ─── */
  function textNote(text: string) {
    checkPage(6);
    y += 1;
    doc.setFontSize(8);
    doc.setFont(F, 'normal');
    doc.setTextColor(...MUTED);
    doc.text(text, mL + 4, y);
    doc.setTextColor(...DARK);
    y += 3;
  }

  /* ─── Aspect-preserving image draw ───
   * Centres the image inside (boxW × boxH) at (x, y) without stretching. */
  function drawAspectFit(data: string, x: number, y: number, boxW: number, boxH: number) {
    try {
      const formatMatch = /^data:image\/(\w+);base64,/.exec(data);
      const fmt = (formatMatch?.[1] ?? 'jpeg').toUpperCase();
      const props = doc.getImageProperties(data);
      const aspect = props.width / props.height;
      let drawW = boxW;
      let drawH = boxW / aspect;
      if (drawH > boxH) {
        drawH = boxH;
        drawW = boxH * aspect;
      }
      const xOffset = (boxW - drawW) / 2;
      const yOffset = (boxH - drawH) / 2;
      doc.addImage(data, fmt, x + xOffset, y + yOffset, drawW, drawH);
      return true;
    } catch {
      return false;
    }
  }

  /* ─── Included items list ───
   * Optionally draws a photo on the right (inline with the kit list) and
   * wraps the items text to the narrower left column. */
  function includedItemsList(items: string[], rightPhoto?: KpPhotoEmbed) {
    if (items.length === 0 && !rightPhoto) return;

    const photoBoxW = rightPhoto ? 60 : 0;
    const photoBoxH = 45;
    const photoGap = 6;
    const captionH = rightPhoto ? 5 : 0;
    const itemsCol = cW - photoBoxW - (rightPhoto ? photoGap + 4 : 0);

    const lineH = 3.5;

    // Pre-wrap items so we know the actual line count for height estimate
    doc.setFontSize(8);
    doc.setFont(F, 'normal');
    let totalItemLines = 0;
    const wrappedItems: string[][] = [];
    for (const item of items) {
      const w = doc.splitTextToSize('•  ' + item, itemsCol);
      wrappedItems.push(w);
      totalItemLines += w.length;
    }

    let estimatedH = 6 + totalItemLines * lineH;
    if (rightPhoto) estimatedH = Math.max(estimatedH, photoBoxH + captionH + 4);
    checkPage(estimatedH);

    const startY = y;

    // Photo on the right (absolute position so it doesn't move with the text)
    if (rightPhoto) {
      const imgX = pageW - mR - photoBoxW;
      drawAspectFit(rightPhoto.data, imgX, startY + 2, photoBoxW, photoBoxH);
      doc.setFontSize(8);
      doc.setFont(F, 'bold');
      doc.setTextColor(...DARK);
      doc.text(rightPhoto.label, imgX + photoBoxW / 2, startY + photoBoxH + 6, {
        align: 'center',
        maxWidth: photoBoxW,
      });
    }

    // Items list on the left, wrapped to the narrowed column
    y += 3;
    doc.setFontSize(8);
    doc.setFont(F, 'bold');
    doc.setTextColor(...MUTED);
    doc.text('\u0427\u0442\u043E \u0432\u0445\u043E\u0434\u0438\u0442 \u0432 \u043A\u043E\u043C\u043F\u043B\u0435\u043A\u0442:', mL + 4, y);
    y += 4;

    doc.setFont(F, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...SUBTLE);
    for (const lines of wrappedItems) {
      for (const line of lines) {
        checkPage(lineH + 2);
        doc.text(line, mL + 6, y);
        y += lineH;
      }
    }
    doc.setTextColor(...DARK);
    // Push y past the photo+caption if the text was shorter than the image
    y = Math.max(y, startY + photoBoxH + captionH + 4);
    y += 2;
  }

  // ═══════════════════════════════════════════════════════
  //  PAGE 1: TITLE BLOCK
  // ═══════════════════════════════════════════════════════

  y = headerEnd + 6;

  doc.setFontSize(14);
  doc.setFont(F, 'bold');
  doc.setTextColor(...DARK);
  doc.text('\u041A\u041E\u041C\u041C\u0415\u0420\u0427\u0415\u0421\u041A\u041E\u0415 \u041F\u0420\u0415\u0414\u041B\u041E\u0416\u0415\u041D\u0418\u0415', pageW / 2, y, { align: 'center' });
  y += 6;

  const objectLabel = d.isTruck
    ? '\u0413\u0440\u0443\u0437\u043E\u0432\u0430\u044F \u043C\u043E\u0439\u043A\u0430'
    : d.isRobot
      ? '\u0420\u043E\u0431\u043E\u0442\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u0430\u044F \u043C\u043E\u0439\u043A\u0430'
      : '\u041C\u043E\u0439\u043A\u0430 \u0441\u0430\u043C\u043E\u043E\u0431\u0441\u043B\u0443\u0436\u0438\u0432\u0430\u043D\u0438\u044F';
  doc.setFontSize(10);
  doc.setFont(F, 'normal');
  doc.setTextColor(...MUTED);
  doc.text(objectLabel, pageW / 2, y, { align: 'center' });
  doc.setTextColor(...DARK);
  y += 8;

  // ── Info block ──
  const valX = mL + 38;
  const rightLabelX = pageW / 2 + 6;
  const rightValX = pageW / 2 + 38;
  const dash = (v: string) => v || '\u2014';

  doc.setFontSize(9);

  doc.setFont(F, 'normal'); doc.setTextColor(...MUTED);
  doc.text('\u041A\u043B\u0438\u0435\u043D\u0442:', mL, y);
  doc.setFont(F, 'bold'); doc.setTextColor(...DARK);
  doc.text(dash(d.header.client), valX, y);
  doc.setFont(F, 'normal'); doc.setTextColor(...MUTED);
  doc.text('\u041C\u0435\u043D\u0435\u0434\u0436\u0435\u0440:', rightLabelX, y);
  doc.setFont(F, 'bold'); doc.setTextColor(...DARK);
  doc.text(dash(d.header.manager), rightValX, y);
  y += 5;

  doc.setFont(F, 'normal'); doc.setTextColor(...MUTED);
  doc.text('\u0422\u0438\u043F \u0442\u0440\u0430\u043D\u0441\u043F\u043E\u0440\u0442\u0430:', mL, y);
  doc.setFont(F, 'bold'); doc.setTextColor(...DARK);
  doc.text(dash(d.header.vehicleType), valX, y);
  y += 5;

  doc.setFont(F, 'normal'); doc.setTextColor(...MUTED);
  doc.text('\u0420\u0435\u0433\u0438\u043E\u043D \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0438:', mL, y);
  doc.setFont(F, 'bold'); doc.setTextColor(...DARK);
  doc.text(dash(d.header.region), valX, y);
  y += 4;

  // ═══════════════════════════════════════════════════════
  //  CONTENT
  // ═══════════════════════════════════════════════════════

  if (d.isTruck && d.truck) {
    sectionTitle('\u0413\u0440\u0443\u0437\u043E\u0432\u0430\u044F \u043C\u043E\u0439\u043A\u0430');
    priceTable('\u041E\u0441\u043D\u043E\u0432\u043D\u043E\u0435 \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435', [
      { name: d.truck.typeName, price: d.truck.typePrice },
    ]);
    includedItemsList(d.truck.includedItems);
    if (d.truck.burPrice > 0) {
      priceTable('\u0411\u0423\u0420', [
        { name: d.truck.burName, price: d.truck.burPrice },
      ]);
    }
    if (d.truck.options.length > 0) {
      priceTable('\u041E\u043F\u0446\u0438\u0438', d.truck.options);
    }
    if (d.truck.manualPost.length > 0) {
      priceTable('\u0420\u0443\u0447\u043D\u043E\u0439 \u043F\u043E\u0441\u0442', d.truck.manualPost);
      if (d.truck.manualPostMontage > 0) {
        textNote('\u041C\u043E\u043D\u0442\u0430\u0436 \u0440\u0443\u0447\u043D\u043E\u0433\u043E \u043F\u043E\u0441\u0442\u0430: ' + fmt(d.truck.manualPostMontage));
      }
    }
    if (d.truck.waterPrice > 0) {
      priceTable('\u0412\u043E\u0434\u043E\u043E\u0447\u0438\u0441\u0442\u043A\u0430', [
        { name: d.truck.waterLabel, price: d.truck.waterPrice },
      ]);
    }
    subtotalLine('\u0418\u0442\u043E\u0433\u043E \u0433\u0440\u0443\u0437\u043E\u0432\u0430\u044F \u043C\u043E\u0439\u043A\u0430:', d.truck.truckTotal);

  } else if (d.isRobot && d.robot) {
    sectionTitle('\u0420\u043E\u0431\u043E\u0442');
    priceTable('\u041E\u0441\u043D\u043E\u0432\u043D\u043E\u0435 \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435', [
      { name: d.robot.modelName, price: d.robot.modelPrice },
      { name: '\u0411\u0423\u0420: ' + d.robot.burName, price: d.robot.burPrice },
    ]);
    includedItemsList(d.robot.includedComponents);
    if (d.robot.options.length > 0) {
      priceTable('\u041E\u043F\u0446\u0438\u0438 \u0440\u043E\u0431\u043E\u0442\u0430', d.robot.options);
    }
    if (d.robot.subOptions && d.robot.subOptions.length > 0) {
      // \u041E\u043F\u0446\u0438\u0438 \u0442\u0435\u0440\u043C\u0438\u043D\u0430\u043B\u0430 = "\u041E\u043F\u0446\u0438\u0438 \u0442\u0435\u0440\u043C\u0438\u043D\u0430\u043B\u0430"
      priceTable('\u041E\u043F\u0446\u0438\u0438 \u0442\u0435\u0440\u043C\u0438\u043D\u0430\u043B\u0430', d.robot.subOptions);
    }
    if (d.robot.extras && d.robot.extras.length > 0) {
      priceTable('\u0414\u043E\u043F. \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435', d.robot.extras);
    }
    subtotalLine('\u0418\u0442\u043E\u0433\u043E \u0440\u043E\u0431\u043E\u0442:', d.robot.robotTotal);

  } else {
    // MSO — group identical posts
    const groups = groupPosts(d.posts);

    groups.forEach((group, gIdx) => {
      const { post, count } = group;
      const title = count > 1
        ? `\u041F\u043E\u0441\u0442 \u2014 ${post.profileName} (\u00D7${count})`
        : (groups.length === 1 ? `\u041F\u043E\u0441\u0442 \u2014 ${post.profileName}` : post.title);

      sectionTitle(title);

      const baseRows: PostRow[] = [
        { name: `\u0411\u0430\u0437\u043E\u0432\u0430\u044F \u043A\u043E\u043C\u043F\u043B\u0435\u043A\u0442\u0430\u0446\u0438\u044F (${post.profileName})`, price: post.basePrice },
      ];
      if (post.bumSwapped) {
        baseRows.push({
          name: `Замена терминала: ${post.defaultBumName} → ${post.bumName}`,
          price: post.bumPrice,
        });
      }
      priceTable('\u041E\u0441\u043D\u043E\u0432\u043D\u043E\u0435 \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435', baseRows);

      // Included items, with the post's BUM photo on the right (if marked "В КП")
      const bumPhoto = consume('bum_models', post.bumId);
      includedItemsList(post.includedItems, bumPhoto);

      if (post.payments.length > 0) {
        priceTable('\u0421\u0438\u0441\u0442\u0435\u043C\u044B \u043E\u043F\u043B\u0430\u0442\u044B', post.payments);
      }

      if (post.accessories.length > 0) {
        priceTable('\u0410\u043A\u0441\u0435\u0441\u0441\u0443\u0430\u0440\u044B', post.accessories);
      }

      if (post.baseFunctions.length > 0) {
        textNote('\u0411\u0430\u0437\u043E\u0432\u044B\u0435 \u0444\u0443\u043D\u043A\u0446\u0438\u0438: ' + post.baseFunctions.map((f) => f.name).join(', ') + ' (\u0432\u0445\u043E\u0434\u044F\u0442 \u0432 \u043A\u043E\u043C\u043F\u043B\u0435\u043A\u0442)');
      }

      if (post.functions.length > 0) {
        priceTable('\u0424\u0443\u043D\u043A\u0446\u0438\u0438 \u043C\u043E\u0439\u043A\u0438', post.functions);
      }

      if (post.pumps.length > 0) {
        priceTable('\u0410\u0412\u0414 (\u043F\u043E\u043C\u043F\u044B)', post.pumps);
      }

      const extrasWithPump = [...post.postExtras];
      if (post.secondPump) extrasWithPump.push(post.secondPump);
      if (post.postVacuum) extrasWithPump.push(post.postVacuum);
      if (extrasWithPump.length > 0) {
        priceTable('\u0414\u043E\u043F. \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435 \u043A \u043F\u043E\u0441\u0442\u0443', extrasWithPump);
      }

      // Subtotal: show per-post and total for group
      subtotalLine('\u0421\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C 1 \u043F\u043E\u0441\u0442\u0430:', post.postTotal);
      if (count > 1) {
        subtotalLine(`\u0421\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C ${count} \u043F\u043E\u0441\u0442\u043E\u0432:`, post.postTotal * count);
      }
    });
  }

  // ═══════════════════════════════════════════════════════
  //  WASH BLOCK (not for truck)
  // ═══════════════════════════════════════════════════════

  if (!d.isTruck) {
    sectionTitle('\u041E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435 \u043D\u0430 \u043C\u043E\u0439\u043A\u0443');

    if (d.wash.waterRows.length > 0) {
      priceTable('\u0412\u043E\u0434\u043E\u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0430', d.wash.waterRows);
    }

    if (d.wash.vacuumPrice > 0) {
      priceTable('\u041F\u044B\u043B\u0435\u0441\u043E\u0441\u044B', [
        { name: d.wash.vacuumLabel, price: d.wash.vacuumPrice },
      ]);
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

  // ═══════════════════════════════════════════════════════
  //  GRAND TOTALS BLOCK
  // ═══════════════════════════════════════════════════════

  const totalsRows: { label: string; value: string }[] = [];
  const hasExtras = d.totals.discountAmount > 0
    || (d.totals.montageType !== '\u041D\u0435\u0442' && d.totals.montageAmount > 0)
    || (d.totals.vatEnabled && d.totals.vatAmount > 0);

  if (hasExtras) {
    totalsRows.push({ label: '\u0418\u0442\u043E\u0433\u043E \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435', value: fmt(d.totals.subtotal) });
  }

  if (d.totals.discountAmount > 0) {
    totalsRows.push({ label: '\u0421\u043A\u0438\u0434\u043A\u0430 ' + d.totals.discountPct + '%', value: '\u2212 ' + fmt(d.totals.discountAmount) });
  }

  if (d.totals.montageType !== '\u041D\u0435\u0442' && d.totals.montageAmount > 0) {
    totalsRows.push({ label: d.totals.montageType, value: fmt(d.totals.montageAmount) });
    if (d.totals.montageExtra > 0) {
      totalsRows.push({ label: '\u0414\u043E\u043F. \u0440\u0430\u0431\u043E\u0442\u044B \u043F\u043E \u043C\u043E\u043D\u0442\u0430\u0436\u0443', value: fmt(d.totals.montageExtra) });
    }
  }

  if (d.totals.vatEnabled && d.totals.vatAmount > 0) {
    totalsRows.push({ label: '\u041D\u0414\u0421 ' + d.totals.vatPct + '%', value: fmt(d.totals.vatAmount) });
  }

  const rowH = 7;
  const pad = 8;
  const totalLineH = 10;
  const blockH = pad + totalsRows.length * rowH + 4 + totalLineH + pad;

  checkPage(blockH + 6);
  y += 6;

  doc.setFillColor(...BLOCK_BG);
  doc.roundedRect(mL, y, cW, blockH, 2, 2, 'F');

  let by = y + pad;
  doc.setFontSize(10);

  totalsRows.forEach((row, i) => {
    doc.setFont(F, 'normal');
    doc.setTextColor(...SUBTLE);
    doc.text(row.label, mL + pad, by);
    doc.text(row.value, mL + cW - pad, by, { align: 'right' });
    by += rowH;
    if (i < totalsRows.length - 1) {
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.15);
      doc.line(mL + pad, by - 3, mL + cW - pad, by - 3);
    }
  });

  by += 2;
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(1.2);
  doc.line(mL + pad, by, mL + cW - pad, by);
  by += 6;

  doc.setFontSize(13);
  doc.setFont(F, 'bold');
  doc.setTextColor(...BLUE);
  doc.text('\u0418\u0422\u041E\u0413\u041E', mL + pad, by);
  doc.text(fmt(d.totals.total), mL + cW - pad, by, { align: 'right' });

  y = y + blockH + 6;
  doc.setTextColor(...DARK);

  // ═══════════════════════════════════════════════════════
  //  CONDITIONS
  // ═══════════════════════════════════════════════════════

  if (d.deliveryConditions !== '\u2014' || d.paymentConditions !== '\u2014') {
    checkPage(20);
    y += 4;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(mL, y, pageW - mR, y);
    y += 6;

    doc.setFontSize(11);
    doc.setFont(F, 'bold');
    doc.setTextColor(...DARK);
    doc.text('\u0423\u0441\u043B\u043E\u0432\u0438\u044F', mL, y);
    y += 5;

    doc.setFontSize(9);

    if (d.deliveryConditions !== '\u2014') {
      doc.setFont(F, 'bold');
      doc.setTextColor(...DARK);
      doc.text('\u0423\u0441\u043B\u043E\u0432\u0438\u044F \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0438:', mL, y);
      doc.setFont(F, 'normal');
      y += 4;
      const lines = doc.splitTextToSize(d.deliveryConditions, cW - 4);
      doc.text(lines, mL + 2, y);
      y += lines.length * 4 + 3;
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
      y += lines.length * 4 + 3;
    }
  }

  // ═══════════════════════════════════════════════════════
  //  EQUIPMENT PHOTOS (optional appendix)
  // ═══════════════════════════════════════════════════════

  // Skip photos already embedded inline (e.g. БУМ next to the kit list).
  const remainingPhotos = photos.filter((p) => !consumedKeys.has(`${p.table}:${p.id}`));
  if (remainingPhotos.length > 0) {
    sectionTitle('Фото оборудования');

    const imgW = 40;
    const imgH = 30;
    const rowGap = 6;
    const textPad = 6;

    for (const p of remainingPhotos) {
      checkPage(imgH + rowGap + 2);
      const startY = y;
      // Aspect-preserving image draw — all photos sit in a uniform 40×30 box,
      // centred, so wide and tall sources visually match.
      drawAspectFit(p.data, mL, startY, imgW, imgH);
      const textX = mL + imgW + textPad;
      doc.setFontSize(10);
      doc.setFont(F, 'bold');
      doc.setTextColor(...DARK);
      const labelLines = doc.splitTextToSize(p.label, pageW - mR - textX - 30);
      doc.text(labelLines, textX, startY + 6);
      doc.setFont(F, 'normal');
      doc.setTextColor(...BLUE);
      doc.text(fmt(p.price), pageW - mR, startY + 6, { align: 'right' });
      doc.setTextColor(...DARK);
      y = startY + imgH + rowGap;
    }
  }

  // ═══════════════════════════════════════════════════════
  //  FINALIZE
  // ═══════════════════════════════════════════════════════

  drawAllHeadersFooters();
  doc.save(makeFileName(state, 'pdf'));
}
