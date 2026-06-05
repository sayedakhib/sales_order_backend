import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { nextSequence } from '../models/Counter.js';
import { ApiError, asyncHandler } from '../utils/apiError.js';
import { buildPricedItem, computeOrderTotals } from '../services/orderCalc.js';
import env from '../config/env.js';
import { sendOrderEmail } from '../services/emailService.js';

// Generate next order number: SO-YYYY####  (e.g. SO-20260001)
async function generateOrderNumber() {
  const year = new Date().getFullYear();
  const seq = await nextSequence(`order-${year}`);
  return `SO-${year}${String(seq).padStart(4, '0')}`;
}

/**
 * POST /api/orders
 * Validates customer, products, stock, quantities, delivery date (Scenarios 1-10),
 * computes line + order totals, decrements stock, updates customer outstanding,
 * then (best-effort) emails the order PDF to owner + manager.
 */
export const createOrder = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const { customer: customerId, salesPerson, deliveryDate, orderDate, remarks, bookingNumber } = body;
  const items = Array.isArray(body.items) ? body.items : [];
  const status = body.status === 'draft' ? 'draft' : 'submitted';

  // --- Scenario 9: Missing customer ---
  if (!customerId) throw ApiError.badRequest('Customer is required');
  if (!mongoose.isValidObjectId(customerId)) throw ApiError.badRequest('Invalid customer id');

  // --- Scenario 10: Missing delivery date (required for submitted orders) ---
  if (status !== 'draft' && !deliveryDate) throw ApiError.badRequest('Delivery date is required');

  if (!items.length) throw ApiError.badRequest('At least one order item is required');

  // --- Customer must exist and (Scenario 7) be active ---
  const customer = await Customer.findById(customerId);
  if (!customer) throw ApiError.notFound('Customer not found');
  if (status !== 'draft' && customer.status !== 'active') {
    throw ApiError.badRequest('Cannot create order for an inactive customer');
  }

  // --- Resolve & validate each item ---
  const productIds = items.map((i) => i.product);
  for (const id of productIds) {
    if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest(`Invalid product id: ${id}`);
  }
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const pricedItems = [];
  for (const input of items) {
    const product = productMap.get(String(input.product));
    if (!product) throw ApiError.notFound(`Product not found: ${input.product}`);

    // --- Scenario 8: Invalid quantity ---
    const qty = Number(input.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      throw ApiError.badRequest(`Quantity must be greater than 0 for ${product.productName}`);
    }

    // --- Scenario 6: Inactive product ---
    if (status !== 'draft' && product.status !== 'active') {
      throw ApiError.badRequest(`Product is inactive: ${product.productName}`);
    }

    const priced = buildPricedItem(product, input);

    // --- Scenario 5: Insufficient stock (qty + FOC free units) ---
    const required = priced.quantity + priced.focQuantity;
    if (status !== 'draft' && required > product.stockQuantity) {
      throw ApiError.badRequest(
        `Insufficient stock for ${product.productName}: available ${product.stockQuantity}, required ${required}`
      );
    }

    pricedItems.push(priced);
  }

  // --- Order totals (Scenario 1,2,4 + VAT) ---
  const totals = computeOrderTotals(pricedItems, env.vatPercent);

  // --- Sales person (optional) ---
  let salesPersonDoc = null;
  if (salesPerson && mongoose.isValidObjectId(salesPerson)) {
    salesPersonDoc = await User.findById(salesPerson);
  }

  const orderNumber = await generateOrderNumber();

  const order = await Order.create({
    orderNumber,
    bookingNumber: bookingNumber || `BK-${orderNumber.replace('SO-', '')}`,
    customer: customer._id,
    customerName: customer.customerName,
    salesPerson: salesPersonDoc?._id,
    salesPersonName: salesPersonDoc?.name || body.salesPersonName || '',
    orderDate: orderDate ? new Date(orderDate) : new Date(),
    deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
    remarks: remarks || '',
    items: pricedItems,
    ...totals,
    status,
  });

  // --- Side effects only for submitted (not draft) orders ---
  if (status === 'submitted') {
    // Decrement stock (qty + FOC) for each product.
    await Promise.all(
      pricedItems.map((it) =>
        Product.updateOne(
          { _id: it.product },
          { $inc: { stockQuantity: -(it.quantity + it.focQuantity) } }
        )
      )
    );
    // Increase customer outstanding by grand total.
    await Customer.updateOne(
      { _id: customer._id },
      { $inc: { outstandingAmount: totals.grandTotal } }
    );

    // Best-effort email notification with PDF attachment (Task 7).
    sendOrderEmail(order._id).catch((err) =>
      console.error('[email] order notification failed:', err.message)
    );
  }

  const populated = await Order.findById(order._id).populate('customer salesPerson');
  res.status(201).json({ success: true, message: 'Order created', data: populated });
});

// GET /api/orders  -> listing with filters (Task 5)
export const listOrders = asyncHandler(async (req, res) => {
  const { q, orderNumber, customer, status, dateFrom, dateTo, page = 1, limit = 50 } = req.query;
  const filter = {};

  if (orderNumber) filter.orderNumber = new RegExp(orderNumber.trim(), 'i');
  if (q) {
    const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ orderNumber: rx }, { customerName: rx }];
  }
  if (customer && mongoose.isValidObjectId(customer)) filter.customer = customer;
  if (status) filter.status = status;
  if (dateFrom || dateTo) {
    filter.orderDate = {};
    if (dateFrom) filter.orderDate.$gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      filter.orderDate.$lte = end;
    }
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ orderDate: -1 }).skip(skip).limit(Number(limit)),
    Order.countDocuments(filter),
  ]);

  const data = orders.map((o) => ({
    id: o._id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    orderDate: o.orderDate,
    deliveryDate: o.deliveryDate,
    totalAmount: o.grandTotal,
    status: o.status,
  }));

  res.json({ success: true, total, page: Number(page), limit: Number(limit), data });
});

// GET /api/orders/:id  -> full order
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('customer salesPerson');
  if (!order) throw ApiError.notFound('Order not found');
  res.json({ success: true, data: order });
});

// Allowed status transitions (order status workflow).
export const ORDER_TRANSITIONS = {
  draft: ['submitted', 'cancelled'],
  submitted: ['confirmed', 'cancelled'],
  confirmed: ['delivered', 'cancelled'],
  delivered: [], // terminal
  cancelled: [], // terminal
};

// Statuses that have reserved stock / added to customer outstanding.
const STOCK_HELD = new Set(['submitted', 'confirmed']);

// Apply (sign = -1) or restore (sign = +1) stock for an order's items.
async function adjustStock(items, sign) {
  await Promise.all(
    items.map((it) =>
      Product.updateOne(
        { _id: it.product },
        { $inc: { stockQuantity: sign * (it.quantity + (it.focQuantity || 0)) } }
      )
    )
  );
}

/**
 * PATCH /api/orders/:id/status  -> advance an order through its workflow.
 * Enforces valid transitions and keeps stock / outstanding consistent:
 *  - draft -> submitted: validate active + stock, decrement stock,
 *    add to customer outstanding, email the PDF.
 *  - submitted/confirmed -> cancelled: restore stock, reduce outstanding.
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status: next } = req.body || {};
  if (!next) throw ApiError.badRequest('status is required');

  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');

  const current = order.status;
  if (next === current) throw ApiError.badRequest(`Order is already "${current}"`);

  const allowed = ORDER_TRANSITIONS[current] || [];
  if (!allowed.includes(next)) {
    throw ApiError.badRequest(
      `Cannot change status from "${current}" to "${next}". Allowed: ${allowed.join(', ') || 'none (terminal)'}`
    );
  }

  // --- Transition: draft -> submitted (acts like submitting the draft) ---
  if (current === 'draft' && next === 'submitted') {
    const products = await Product.find({ _id: { $in: order.items.map((i) => i.product) } });
    const map = new Map(products.map((p) => [String(p._id), p]));
    for (const it of order.items) {
      const p = map.get(String(it.product));
      if (!p) throw ApiError.notFound(`Product not found: ${it.productName}`);
      if (p.status !== 'active') throw ApiError.badRequest(`Product is inactive: ${p.productName}`);
      const required = it.quantity + (it.focQuantity || 0);
      if (required > p.stockQuantity) {
        throw ApiError.badRequest(
          `Insufficient stock for ${p.productName}: available ${p.stockQuantity}, required ${required}`
        );
      }
    }
    await adjustStock(order.items, -1);
    await Customer.updateOne({ _id: order.customer }, { $inc: { outstandingAmount: order.grandTotal } });
  }

  // --- Transition: -> cancelled from a stock-holding state (reverse effects) ---
  if (next === 'cancelled' && STOCK_HELD.has(current)) {
    await adjustStock(order.items, +1);
    await Customer.updateOne({ _id: order.customer }, { $inc: { outstandingAmount: -order.grandTotal } });
  }

  order.status = next;
  await order.save();

  // Email on a draft being submitted (best-effort).
  if (current === 'draft' && next === 'submitted') {
    sendOrderEmail(order._id).catch((err) =>
      console.error('[email] order notification failed:', err.message)
    );
  }

  const populated = await Order.findById(order._id).populate('customer salesPerson');
  res.json({
    success: true,
    message: `Status updated to "${next}"`,
    data: populated,
    allowedNext: ORDER_TRANSITIONS[next] || [],
  });
});
