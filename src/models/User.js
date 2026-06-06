import mongoose from 'mongoose';

// We don't have a login system, but we still seed a few users with roles so
// the "super admin sets credit limit" and "email the owner + manager" bits
// have someone to point at.
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
