import nodemailer from 'nodemailer';
import env from '../config/env.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { generateOrderPdfBuffer } from './pdfService.js';

let transporter = null;

// build the nodemailer transporter once, on first use.
// if there's no SMTP config we just return null and skip sending.
function getTransporter() {
  if (transporter) return transporter;
  if (!env.smtp.host || !env.smtp.user) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });
  return transporter;
}

// who gets the email - use the env list if set, otherwise the owner + manager
async function resolveRecipients() {
  if (env.smtp.recipients.length) return env.smtp.recipients;
  const users = await User.find({
    role: { $in: ['company_owner', 'sales_manager'] },
    status: 'active',
  }).select('email');
  return users.map((u) => u.email).filter(Boolean);
}

// emails the order out with the PDF attached. returns false (instead of throwing)
// if there's no SMTP set up or nobody to send to, so it never blocks an order.
export async function sendOrderEmail(orderId) {
  const tx = getTransporter();
  if (!tx) {
    console.warn('[email] SMTP not configured - skipping order notification email.');
    return false;
  }

  const order = await Order.findById(orderId).populate('customer salesPerson');
  if (!order) throw new Error('Order not found for email');

  const recipients = await resolveRecipients();
  if (!recipients.length) {
    console.warn('[email] No recipients resolved - skipping.');
    return false;
  }

  const pdf = await generateOrderPdfBuffer(order);
  const cur = env.currency;

  const html = `
    <h2>New Sales Order: ${order.orderNumber}</h2>
    <table cellpadding="6" style="border-collapse:collapse">
      <tr><td><b>Order Number</b></td><td>${order.orderNumber}</td></tr>
      <tr><td><b>Customer</b></td><td>${order.customerName}</td></tr>
      <tr><td><b>Sales Person</b></td><td>${order.salesPersonName || '-'}</td></tr>
      <tr><td><b>Delivery Date</b></td><td>${
        order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-GB') : '-'
      }</td></tr>
      <tr><td><b>Total Amount</b></td><td>${Number(order.grandTotal).toFixed(3)} ${cur}</td></tr>
    </table>
    <p>The full order PDF is attached.</p>
  `;

  const info = await tx.sendMail({
    from: env.smtp.from,
    to: recipients.join(','),
    subject: `Sales Order ${order.orderNumber} - ${order.customerName}`,
    html,
    attachments: [{ filename: `${order.orderNumber}.pdf`, content: pdf }],
  });

  console.log(`[email] order ${order.orderNumber} sent to ${recipients.join(', ')} (${info.messageId})`);
  return true;
}
