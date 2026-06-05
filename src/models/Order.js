import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productCode: { type: String, default: '' },
    productName: { type: String, default: '' },
    brand: { type: String, default: '' },

    quantity: { type: Number, required: true, min: 1 },
    focQuantity: { type: Number, default: 0, min: 0 },
    rate: { type: Number, required: true, min: 0 },
    discountPercentage: { type: Number, default: 0, min: 0, max: 100 },

    // Derived figures (computed server-side, stored for history/PDF).
    grossAmount: { type: Number, default: 0 }, // rate * quantity
    discountAmount: { type: Number, default: 0 }, // gross * disc%
    lineTotal: { type: Number, default: 0 }, // gross - discount
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true }, // SO-20260001
    bookingNumber: { type: String, default: '' },

    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    customerName: { type: String, default: '' },
    salesPerson: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    salesPersonName: { type: String, default: '' },

    orderDate: { type: Date, default: Date.now },
    deliveryDate: { type: Date, required: true },
    remarks: { type: String, default: '' },

    items: {
      type: [orderItemSchema],
      validate: [(v) => Array.isArray(v) && v.length > 0, 'At least one item is required'],
    },

    // Order-level totals.
    subtotal: { type: Number, default: 0 }, // sum of gross amounts
    totalDiscount: { type: Number, default: 0 }, // sum of line discounts
    totalFoc: { type: Number, default: 0 }, // sum of free units
    netAmount: { type: Number, default: 0 }, // subtotal - totalDiscount
    vatPercent: { type: Number, default: 0 },
    vatAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 }, // netAmount + vat

    status: {
      type: String,
      enum: ['draft', 'submitted', 'confirmed', 'delivered', 'cancelled'],
      default: 'submitted',
    },
  },
  { timestamps: true }
);

orderSchema.index({ orderNumber: 'text', customerName: 'text' });

const Order = mongoose.model('Order', orderSchema);
export default Order;
