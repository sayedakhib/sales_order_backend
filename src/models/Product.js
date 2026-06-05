import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    productCode: { type: String, required: true, unique: true, trim: true },
    productName: { type: String, required: true, trim: true },
    genericName: { type: String, default: '', trim: true },
    brand: { type: String, default: '', trim: true },
    category: { type: String, default: '', trim: true },

    // e.g. "500mg Tablet", "Syrup", "Drops" - used by the variations API.
    variation: { type: String, default: '' },

    stockQuantity: { type: Number, default: 0, min: 0 },
    sellingPrice: { type: Number, default: 0, min: 0 },
    discountPercentage: { type: Number, default: 0, min: 0, max: 100 },

    // FOC (Free Of Charge): buy `focBuyQuantity` -> get `focFreeQuantity` free.
    focBuyQuantity: { type: Number, default: 0, min: 0 },
    focFreeQuantity: { type: Number, default: 0, min: 0 },

    imageUrl: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

productSchema.index({
  productName: 'text',
  productCode: 'text',
  genericName: 'text',
  brand: 'text',
  category: 'text',
});

// Whether the product currently has a FOC scheme.
productSchema.virtual('hasFoc').get(function () {
  return this.focBuyQuantity > 0 && this.focFreeQuantity > 0;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);
export default Product;
