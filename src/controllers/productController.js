import Product from '../models/Product.js';
import { ApiError, asyncHandler } from '../utils/apiError.js';

// one regex matched against all the searchable product fields (escaped so
// special characters in the query are treated literally)
function searchFilter(q) {
  if (!q) return {};
  const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return {
    $or: [
      { productName: rx },
      { productCode: rx },
      { genericName: rx },
      { brand: rx },
      { category: rx },
    ],
  };
}

// GET /api/products - list, with a bunch of optional filters
export const listProducts = asyncHandler(async (req, res) => {
  const { q, brand, category, generic, status, inStock, page = 1, limit = 50 } = req.query;
  const filter = { ...searchFilter(q) };
  if (brand) filter.brand = new RegExp(`^${brand}$`, 'i');
  if (category) filter.category = new RegExp(`^${category}$`, 'i');
  if (generic) filter.genericName = new RegExp(`^${generic}$`, 'i');
  if (status) filter.status = status;
  if (inStock === 'true') filter.stockQuantity = { $gt: 0 };

  const skip = (Number(page) - 1) * Number(limit);
  const [data, total] = await Promise.all([
    Product.find(filter).sort({ productName: 1 }).skip(skip).limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  res.json({ success: true, total, page: Number(page), limit: Number(limit), data });
});

// GET /api/products/search?q= - autocomplete-style search
export const searchProducts = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q) throw ApiError.badRequest('Query parameter "q" is required');
  const data = await Product.find(searchFilter(q)).sort({ productName: 1 }).limit(20);
  res.json({ success: true, total: data.length, data });
});

// GET /api/products/:id - one product with all its details
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  res.json({ success: true, data: product });
});

// GET /api/products/:id/similar - same generic, same category, and brands
// to switch to if this one's out of stock
export const getSimilarProducts = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  const baseFilter = { _id: { $ne: product._id }, status: 'active' };

  const [sameGeneric, sameCategory] = await Promise.all([
    product.genericName
      ? Product.find({ ...baseFilter, genericName: new RegExp(`^${product.genericName}$`, 'i') })
      : [],
    product.category
      ? Product.find({ ...baseFilter, category: new RegExp(`^${product.category}$`, 'i') })
      : [],
  ]);

  // same drug, different brand, and actually in stock
  const alternativeBrands = sameGeneric.filter(
    (p) => p.brand?.toLowerCase() !== product.brand?.toLowerCase() && p.stockQuantity > 0
  );

  res.json({
    success: true,
    data: {
      product: { id: product._id, name: product.productName, generic: product.genericName },
      sameGeneric,
      sameCategory,
      alternativeBrands,
      outOfStock: product.stockQuantity <= 0,
    },
  });
});

// GET /api/products/:id/comparison - line up every brand of the same generic
// so you can compare price/stock/discount side by side
export const getProductComparison = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  const peers = product.genericName
    ? await Product.find({
        genericName: new RegExp(`^${product.genericName}$`, 'i'),
        status: 'active',
      }).sort({ sellingPrice: 1 })
    : [product];

  const comparison = peers.map((p) => ({
    productId: p._id,
    productName: p.productName,
    brand: p.brand,
    price: p.sellingPrice,
    availableStock: p.stockQuantity,
    discount: p.discountPercentage,
    isCurrent: String(p._id) === String(product._id),
  }));

  res.json({
    success: true,
    data: { generic: product.genericName, count: comparison.length, comparison },
  });
});

// GET /api/products/:id/variations - the different forms/strengths of a drug,
// e.g. Paracetamol -> 500mg tablet, syrup, drops
export const getProductVariations = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  // variations all share the same generic name
  const key = product.genericName || product.productName;
  const variations = await Product.find({
    genericName: new RegExp(`^${key}$`, 'i'),
  }).sort({ variation: 1 });

  res.json({
    success: true,
    data: {
      base: product.genericName || product.productName,
      count: variations.length,
      variations: variations.map((p) => ({
        productId: p._id,
        productName: p.productName,
        variation: p.variation,
        brand: p.brand,
        price: p.sellingPrice,
        stock: p.stockQuantity,
        status: p.status,
      })),
    },
  });
});
