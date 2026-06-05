import { Router } from 'express';
import {
  listCustomers,
  searchCustomers,
  getCustomer,
  getCustomerOutstanding,
  getCustomerHistory,
} from '../controllers/customerController.js';

const router = Router();

// NOTE: /search must be declared before /:id so it isn't captured as an id.
router.get('/', listCustomers);
router.get('/search', searchCustomers);
router.get('/:id', getCustomer);
router.get('/:id/outstanding', getCustomerOutstanding);
router.get('/:id/history', getCustomerHistory);

export default router;
