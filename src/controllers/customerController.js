import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import { ApiError, asyncHandler } from '../utils/apiError.js';

// case-insensitive search across the main customer fields.
// the .replace() escapes regex chars so something like "(" can't blow up the query.
function searchFilter(q) {
  if (!q) return {};
  const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return { $or: [{ customerName: rx }, { customerCode: rx }, { contactPerson: rx }, { mobileNumber: rx }] };
}

// GET /api/customers - list, with optional ?q, ?status and paging
export const listCustomers = asyncHandler(async (req, res) => {
  const { q, status, page = 1, limit = 50 } = req.query;
  const filter = { ...searchFilter(q) };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [data, total] = await Promise.all([
    Customer.find(filter).sort({ customerName: 1 }).skip(skip).limit(Number(limit)),
    Customer.countDocuments(filter),
  ]);

  res.json({ success: true, total, page: Number(page), limit: Number(limit), data });
});

// GET /api/customers/search?q= - quick search by name/code
export const searchCustomers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q) throw ApiError.badRequest('Query parameter "q" is required');
  const data = await Customer.find(searchFilter(q)).sort({ customerName: 1 }).limit(20);
  res.json({ success: true, total: data.length, data });
});

// GET /api/customers/:id - full profile
export const getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw ApiError.notFound('Customer not found');
  res.json({ success: true, data: customer });
});

// GET /api/customers/:id/outstanding - what they owe + how much credit is left
export const getCustomerOutstanding = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id).select(
    'customerCode customerName creditLimit outstandingAmount'
  );
  if (!customer) throw ApiError.notFound('Customer not found');
  res.json({
    success: true,
    data: {
      customerId: customer._id,
      customerCode: customer.customerCode,
      customerName: customer.customerName,
      creditLimit: customer.creditLimit,
      outstandingAmount: customer.outstandingAmount,
      availableCredit: customer.availableCredit,
    },
  });
});

// GET /api/customers/:id/history - past orders + how much they've bought
export const getCustomerHistory = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw ApiError.notFound('Customer not found');

  const orders = await Order.find({ customer: customer._id })
    .sort({ orderDate: -1 })
    .select('orderNumber orderDate deliveryDate grandTotal status items');

  const totalPurchased = orders.reduce((s, o) => s + (o.grandTotal || 0), 0);

  res.json({
    success: true,
    data: {
      customer: { id: customer._id, code: customer.customerCode, name: customer.customerName },
      orderCount: orders.length,
      totalPurchased,
      orders,
    },
  });
});
