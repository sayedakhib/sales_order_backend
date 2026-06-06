import PDFDocument from 'pdfkit';
import env from '../config/env.js';

const fmt = (n) => Number(n || 0).toFixed(3);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB') : '-');

// draw the order onto a PDF and hand back the bytes (a Buffer).
// we build it in memory so the same PDF can be downloaded and emailed.
export function generateOrderPdfBuffer(order) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const cur = env.currency;
    const cust = order.customer || {};

    // company name + contact up top
    doc.fontSize(18).font('Helvetica-Bold').text(env.company.name, { align: 'left' });
    doc.fontSize(9).font('Helvetica').fillColor('#555');
    if (env.company.address) doc.text(env.company.address);
    const contact = [env.company.phone, env.company.email].filter(Boolean).join('  |  ');
    if (contact) doc.text(contact);
    doc.fillColor('#000');

    doc.moveDown(0.5);
    doc
      .fontSize(15)
      .font('Helvetica-Bold')
      .text('SALES ORDER', { align: 'right' });
    doc.fontSize(10).font('Helvetica').text(order.orderNumber, { align: 'right' });
    doc.moveTo(40, doc.y + 4).lineTo(555, doc.y + 4).stroke('#cccccc');
    doc.moveDown(1);

    // customer on the left, order details on the right
    const topY = doc.y;
    doc.fontSize(10).font('Helvetica-Bold').text('Bill To:', 40, topY);
    doc.font('Helvetica').fontSize(9);
    doc.text(cust.customerName || order.customerName || '-');
    if (cust.customerCode) doc.text(`Code: ${cust.customerCode}`);
    if (cust.contactPerson) doc.text(`Contact: ${cust.contactPerson}`);
    if (cust.mobileNumber) doc.text(`Mobile: ${cust.mobileNumber}`);
    const addr = cust.address || {};
    const addrLine = [addr.area, addr.city, addr.country].filter(Boolean).join(', ');
    if (addrLine) doc.text(addrLine);

    doc.font('Helvetica').fontSize(9);
    const rightX = 330;
    let ry = topY;
    const metaRow = (label, value) => {
      doc.font('Helvetica-Bold').text(label, rightX, ry, { width: 110, continued: true });
      doc.font('Helvetica').text(`  ${value}`);
      ry = doc.y;
    };
    metaRow('Booking No:', order.bookingNumber || '-');
    metaRow('Order Date:', fmtDate(order.orderDate));
    metaRow('Delivery Date:', fmtDate(order.deliveryDate));
    metaRow('Sales Person:', order.salesPersonName || '-');
    metaRow('Status:', String(order.status || '').toUpperCase());

    doc.moveDown(1);
    let y = Math.max(doc.y, ry) + 10;

    // the line items table - column positions/widths
    const cols = [
      { label: '#', x: 40, w: 22, align: 'left' },
      { label: 'Product', x: 62, w: 168, align: 'left' },
      { label: 'Qty', x: 230, w: 35, align: 'right' },
      { label: 'FOC', x: 265, w: 35, align: 'right' },
      { label: 'Rate', x: 300, w: 55, align: 'right' },
      { label: 'Disc%', x: 355, w: 45, align: 'right' },
      { label: 'Disc', x: 400, w: 65, align: 'right' },
      { label: 'Total', x: 465, w: 90, align: 'right' },
    ];

    const drawRow = (cells, opts = {}) => {
      doc.fontSize(8.5).font(opts.bold ? 'Helvetica-Bold' : 'Helvetica');
      cols.forEach((c, i) => {
        doc.text(String(cells[i] ?? ''), c.x, y, { width: c.w, align: c.align });
      });
      y += opts.tall ? 22 : 16;
    };

    // grey header row
    doc.rect(40, y - 3, 515, 16).fill('#f0f0f0').fillColor('#000');
    drawRow(cols.map((c) => c.label), { bold: true });
    doc.moveTo(40, y - 3).lineTo(555, y - 3).stroke('#cccccc');

    (order.items || []).forEach((it, idx) => {
      if (y > 740) {
        doc.addPage();
        y = 50;
      }
      drawRow([
        idx + 1,
        `${it.productName}${it.brand ? `\n${it.brand}` : ''}`,
        it.quantity,
        it.focQuantity || 0,
        fmt(it.rate),
        it.discountPercentage || 0,
        fmt(it.discountAmount),
        fmt(it.lineTotal),
      ], { tall: !!it.brand });
      doc.moveTo(40, y - 3).lineTo(555, y - 3).stroke('#eeeeee');
    });

    // totals box, bottom-right
    y += 8;
    const sumX = 360;
    const sumRow = (label, value, bold = false) => {
      doc.fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica');
      doc.text(label, sumX, y, { width: 110, align: 'right' });
      doc.text(`${fmt(value)} ${cur}`, sumX + 110, y, { width: 85, align: 'right' });
      y += 15;
    };
    sumRow('Subtotal', order.subtotal);
    sumRow('Discount', order.totalDiscount);
    sumRow(`Total FOC (units)`, order.totalFoc);
    sumRow('Net Amount', order.netAmount);
    sumRow(`VAT (${order.vatPercent}%)`, order.vatAmount);
    doc.moveTo(sumX, y).lineTo(555, y).stroke('#999999');
    y += 4;
    sumRow('Grand Total', order.grandTotal, true);

    if (order.remarks) {
      y += 10;
      doc.fontSize(9).font('Helvetica-Bold').text('Remarks:', 40, y);
      doc.font('Helvetica').text(order.remarks, 40, y + 12, { width: 300 });
    }

    doc.fontSize(8).fillColor('#888').text(
      'This is a system-generated document.',
      40,
      800,
      { align: 'center', width: 515 }
    );

    doc.end();
  });
}
