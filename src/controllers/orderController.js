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

// next order number, e.g. SO-20260001
async function generateOrderNumber() {
  const year = new Date().getFullYear();
  const seq = await nextSequence(`order-${year}`);
  return `SO-${year}${String(seq).padStart(4, '0')}`;
}

// POST /api/orders
// Runs all the order validations, works out the totals, then drops stock,
// bumps the customer's balance and sends the email.
export const createOrder = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const { customer: customerId, salesPerson, deliveryDate, orderDate, remarks, bookingNumber } = body;
  const items = Array.isArray(body.items) ? body.items : [];
  const status = body.status === 'draft' ? 'draft' : 'submitted';

  // need a customer
  if (!customerId) throw ApiError.badRequest('Customer is required');
  if (!mongoose.isValidObjectId(customerId)) throw ApiError.badRequest('Invalid customer id');

  // delivery date only matters once it's a real (non-draft) order
  if (status !== 'draft' && !deliveryDate) throw ApiError.badRequest('Delivery date is required');

  if (!items.length) throw ApiError.badRequest('At least one order item is required');

  // customer must exist, and can't be inactive (drafts are let off)
  const customer = await Customer.findById(customerId);
  if (!customer) throw ApiError.notFound('Customer not found');
  if (status !== 'draft' && customer.status !== 'active') {
    throw ApiError.badRequest('Cannot create order for an inactive customer');
  }

  // grab every product up front and key them by id
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

    // quantity has to be a positive number
    const qty = Number(input.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      throw ApiError.badRequest(`Quantity must be greater than 0 for ${product.productName}`);
    }

    // no selling inactive products
    if (status !== 'draft' && product.status !== 'active') {
      throw ApiError.badRequest(`Product is inactive: ${product.productName}`);
    }

    const priced = buildPricedItem(product, input);

    // enough stock to cover the order + the free FOC units?
    const required = priced.quantity + priced.focQuantity;
    if (status !== 'draft' && required > product.stockQuantity) {
      throw ApiError.badRequest(
        `Insufficient stock for ${product.productName}: available ${product.stockQuantity}, required ${required}`
      );
    }

    pricedItems.push(priced);
  }

  // add up the lines -> subtotal, discount, VAT, grand total
  const totals = computeOrderTotals(pricedItems, env.vatPercent);

  // sales person is optional
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

  // a draft just sits there - only a submitted order touches stock/balance/email
  if (status === 'submitted') {
    // take the sold + free units out of stock
    await Promise.all(
      pricedItems.map((it) =>
        Product.updateOne(
          { _id: it.product },
          { $inc: { stockQuantity: -(it.quantity + it.focQuantity) } }
        )
      )
    );
    // add the bill to what the customer owes
    await Customer.updateOne(
      { _id: customer._id },
      { $inc: { outstandingAmount: totals.grandTotal } }
    );

    // send the email, but don't let a mail failure break the order
    sendOrderEmail(order._id).catch((err) =>
      console.error('[email] order notification failed:', err.message)
    );
  }

  const populated = await Order.findById(order._id).populate('customer salesPerson');
  res.status(201).json({ success: true, message: 'Order created', data: populated });
});

// GET /api/orders - list with search + filters
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
      // push the "to" date to end-of-day so that whole day is included
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

  // trim down to just the columns the listing screen needs
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

// GET /api/orders/:id
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('customer salesPerson');
  if (!order) throw ApiError.notFound('Order not found');
  res.json({ success: true, data: order });
});

// where each status is allowed to go next
export const ORDER_TRANSITIONS = {
  draft: ['submitted', 'cancelled'],
  submitted: ['confirmed', 'cancelled'],
  confirmed: ['delivered', 'cancelled'],
  delivered: [], // nowhere left to go
  cancelled: [], // nowhere left to go
};

// in these states the stock is reserved and it's on the customer's balance
const STOCK_HELD = new Set(['submitted', 'confirmed']);

// pull stock out (-1) or put it back (+1) for every line on the order
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

// PATCH /api/orders/:id/status - move an order along its workflow.
// Keeps stock and the customer's balance in sync when we submit a draft
// or cancel an order that was already holding stock.
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

  // submitting a draft = same checks + stock reservation as a fresh order
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

  // cancelling an order that was holding stock - hand it all back
  if (next === 'cancelled' && STOCK_HELD.has(current)) {
    await adjustStock(order.items, +1);
    await Customer.updateOne({ _id: order.customer }, { $inc: { outstandingAmount: -order.grandTotal } });
  }

  order.status = next;
  await order.save();

  // let the owner/manager know when a draft goes live
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
