import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    productCode: { type: String, required: true, unique: true, trim: true },
    productName: { type: String, required: true, trim: true },
    genericName: { type: String, default: '', trim: true },
    brand: { type: String, default: '', trim: true },
    category: { type: String, default: '', trim: true },

    // the form/strength, e.g. "500mg Tablet", "Syrup", "Drops"
    variation: { type: String, default: '' },

    stockQuantity: { type: Number, default: 0, min: 0 },
    sellingPrice: { type: Number, default: 0, min: 0 },
    discountPercentage: { type: Number, default: 0, min: 0, max: 100 },

    // free-of-charge deal: buy focBuyQuantity, get focFreeQuantity for free
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

// quick flag for "does this product have a FOC offer"
productSchema.virtual('hasFoc').get(function () {
  return this.focBuyQuantity > 0 && this.focFreeQuantity > 0;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);
export default Product;
