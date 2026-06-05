import { Router } from 'express';
import { createOrder, listOrders, getOrder, updateOrderStatus } from '../controllers/orderController.js';
import { downloadOrderPdf, emailOrder } from '../controllers/pdfController.js';

const router = Router();

router.post('/', createOrder);
router.get('/', listOrders);
router.get('/:id', getOrder);
router.patch('/:id/status', updateOrderStatus);
router.get('/:id/pdf', downloadOrderPdf);
router.post('/:id/email', emailOrder);

export default router;
