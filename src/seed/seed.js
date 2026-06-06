// wipes the DB and fills it back up with the company, users, customers,
// products and 10 sample orders. run it with `npm run seed`.
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import env from '../config/env.js';
import Company from '../models/Company.js';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Counter from '../models/Counter.js';
import { buildPricedItem, computeOrderTotals } from '../services/orderCalc.js';
import { company, users, customers, products, orderBlueprints } from './data.js';

function dateDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(10, 0, 0, 0);
  return d;
}
function dateInDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(10, 0, 0, 0);
  return d;
}

async function run() {
  await connectDB();
  console.log('[seed] clearing collections...');
  await Promise.all([
    Company.deleteMany({}),
    User.deleteMany({}),
    Customer.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    Counter.deleteMany({}),
  ]);

  console.log('[seed] inserting company, users, customers, products...');
  await Company.create(company);
  const createdUsers = await User.insertMany(users);
  const createdCustomers = await Customer.insertMany(customers);
  const createdProducts = await Product.insertMany(products);

  const userByEmail = new Map(createdUsers.map((u) => [u.email, u]));
  const customerByCode = new Map(createdCustomers.map((c) => [c.customerCode, c]));
  const productByCode = new Map(createdProducts.map((p) => [p.productCode, p]));

  // keep a running tally of stock used + amounts owed so the seeded numbers
  // actually add up (same as if the orders had been placed for real)
  const stockDelta = new Map();
  const outstandingDelta = new Map();
  const year = new Date().getFullYear();
  let seq = 0;

  console.log('[seed] generating sample orders...');
  const orderDocs = [];
  for (const bp of orderBlueprints) {
    const customer = customerByCode.get(bp.customerCode);
    const salesPerson = userByEmail.get(bp.salesEmail);

    const pricedItems = bp.items.map((line) => {
      const product = productByCode.get(line.code);
      return buildPricedItem(product, { quantity: line.qty });
    });

    const totals = computeOrderTotals(pricedItems, env.vatPercent);
    seq += 1;
    const orderNumber = `SO-${year}${String(seq).padStart(4, '0')}`;

    // tally what this order takes out of stock / adds to the customer's balance
    for (const it of pricedItems) {
      const key = String(it.product);
      stockDelta.set(key, (stockDelta.get(key) || 0) + it.quantity + it.focQuantity);
    }
    outstandingDelta.set(
      String(customer._id),
      (outstandingDelta.get(String(customer._id)) || 0) + totals.grandTotal
    );

    orderDocs.push({
      orderNumber,
      bookingNumber: `BK-${year}${String(seq).padStart(4, '0')}`,
      customer: customer._id,
      customerName: customer.customerName,
      salesPerson: salesPerson?._id,
      salesPersonName: salesPerson?.name || '',
      orderDate: dateDaysAgo(bp.daysAgo),
      deliveryDate: dateInDays(bp.deliveryInDays),
      remarks: bp.remarks,
      items: pricedItems,
      ...totals,
      status: 'submitted',
    });
  }

  await Order.insertMany(orderDocs);

  // save the counter where it left off so live orders carry on numbering from here
  await Counter.create({ _id: `order-${year}`, seq });

  // now actually take the stock off the products
  await Promise.all(
    [...stockDelta.entries()].map(([id, qty]) =>
      Product.updateOne({ _id: id }, { $inc: { stockQuantity: -qty } })
    )
  );
  // ...and add the balances onto the customers
  await Promise.all(
    [...outstandingDelta.entries()].map(([id, amt]) =>
      Customer.updateOne({ _id: id }, { $inc: { outstandingAmount: amt } })
    )
  );

  console.log('[seed] done:');
  console.log(`  company:   1`);
  console.log(`  users:     ${createdUsers.length}`);
  console.log(`  customers: ${createdCustomers.length}`);
  console.log(`  products:  ${createdProducts.length}`);
  console.log(`  orders:    ${orderDocs.length}`);

  await disconnectDB();
  await mongoose.connection.close();
}

run()
  .then(() => {
    console.log('[seed] completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[seed] failed:', err);
    process.exit(1);
  });
