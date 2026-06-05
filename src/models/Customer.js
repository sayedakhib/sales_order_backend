import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    country: { type: String, default: '' },
    city: { type: String, default: '' },
    area: { type: String, default: '' },
    zipcode: { type: String, default: '' },
    googleMapUrl: { type: String, default: '' },
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    customerCode: { type: String, required: true, unique: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    contactPerson: { type: String, default: '' },
    mobileNumber: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: addressSchema, default: () => ({}) },

    // Credit limit configured by super admin (e.g. 100 OMR).
    creditLimit: { type: Number, default: 0, min: 0 },
    // Outstanding amount from the customer's statement.
    outstandingAmount: { type: Number, default: 0, min: 0 },

    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

// Text search across name, code and contact person.
customerSchema.index({ customerName: 'text', customerCode: 'text', contactPerson: 'text' });

// Virtual: available credit = limit - outstanding.
customerSchema.virtual('availableCredit').get(function () {
  return Math.max(0, (this.creditLimit || 0) - (this.outstandingAmount || 0));
});

customerSchema.set('toJSON', { virtuals: true });
customerSchema.set('toObject', { virtuals: true });

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
