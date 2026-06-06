import { Router } from 'express';
import User from '../models/User.js';
import Company from '../models/Company.js';
import { asyncHandler } from '../utils/apiError.js';
import env from '../config/env.js';

const router = Router();

// GET /api/meta/company - company details for the UI header / PDF preview
router.get(
  '/company',
  asyncHandler(async (req, res) => {
    const company = (await Company.findOne()) || env.company;
    res.json({ success: true, data: { ...env.company, ...company.toObject?.(), vatPercent: env.vatPercent, currency: env.currency } });
  })
);

// GET /api/meta/users?role=sales_person - used to fill the sales-person dropdown
router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const filter = { status: 'active' };
    if (req.query.role) filter.role = req.query.role;
    const users = await User.find(filter).select('name email role phone');
    res.json({ success: true, data: users });
  })
);

export default router;
