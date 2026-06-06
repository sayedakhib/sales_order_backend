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

    // credit limit the super admin sets (e.g. 100 OMR)
    creditLimit: { type: Number, default: 0, min: 0 },
    // how much they currently owe us
    outstandingAmount: { type: Number, default: 0, min: 0 },

    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

// lets us text-search by name/code/contact
customerSchema.index({ customerName: 'text', customerCode: 'text', contactPerson: 'text' });

// how much credit they still have left to spend (not stored, worked out on the fly)
customerSchema.virtual('availableCredit').get(function () {
  return Math.max(0, (this.creditLimit || 0) - (this.outstandingAmount || 0));
});

customerSchema.set('toJSON', { virtuals: true });
customerSchema.set('toObject', { virtuals: true });

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
