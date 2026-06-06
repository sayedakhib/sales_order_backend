import mongoose from 'mongoose';

// our own company details - shows up on the PDFs and in the emails
const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    vatPercent: { type: Number, default: 5 },
    currency: { type: String, default: 'OMR' },
    logoUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

const Company = mongoose.model('Company', companySchema);
export default Company;
