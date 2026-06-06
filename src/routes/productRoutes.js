import { Router } from 'express';
import {
  listProducts,
  searchProducts,
  getProduct,
  getSimilarProducts,
  getProductComparison,
  getProductVariations,
} from '../controllers/productController.js';

const router = Router();

// /search before /:id, same reason as the customer routes
router.get('/', listProducts);
router.get('/search', searchProducts);
router.get('/:id', getProduct);
router.get('/:id/similar', getSimilarProducts);
router.get('/:id/comparison', getProductComparison);
router.get('/:id/variations', getProductVariations);

export default router;
