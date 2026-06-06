import Order from '../models/Order.js';
import { ApiError, asyncHandler } from '../utils/apiError.js';
import { generateOrderPdfBuffer } from '../services/pdfService.js';

// GET /api/orders/:id/pdf - send back the order PDF (?inline=true to view in browser)
export const downloadOrderPdf = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('customer salesPerson');
  if (!order) throw ApiError.notFound('Order not found');

  const pdf = await generateOrderPdfBuffer(order);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `${req.query.inline === 'true' ? 'inline' : 'attachment'}; filename="${order.orderNumber}.pdf"`
  );
  res.send(pdf);
});

// POST /api/orders/:id/email - manually fire off (or resend) the order email
export const emailOrder = asyncHandler(async (req, res) => {
  const { sendOrderEmail } = await import('../services/emailService.js');
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  const sent = await sendOrderEmail(order._id);
  res.json({
    success: true,
    sent,
    message: sent
      ? 'Email sent with PDF attachment'
      : 'Email skipped (SMTP not configured or no recipients)',
  });
});
