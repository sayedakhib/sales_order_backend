import mongoose from 'mongoose';

// Roles seeded so that credit-limit setup (super admin) and email
// recipients (company owner / sales manager) and sales persons exist
// without a full auth layer.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: {
      type: String,
      enum: ['super_admin', 'sales_manager', 'company_owner', 'sales_person'],
      required: true,
    },
    phone: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;
