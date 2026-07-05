import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please add a category'],
      enum: ['Cement', 'Steel', 'Bricks', 'Sand', 'Waterproofing', 'Cooling Materials', 'Others'],
      index: true,
    },
    brand: {
      type: String,
      required: [true, 'Please add a brand'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    images: [
      {
        type: String,
        default: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=600',
      },
    ],
    pdfSpecUrl: {
      type: String,
    },
    // Pricing engine tiers
    pricingTiers: {
      Retail: { type: Number, required: true },
      Builder: { type: Number, required: true },
      Contractor: { type: Number, required: true },
      Gold: { type: Number, required: true },
      Silver: { type: Number, required: true },
    },
    lowStockThreshold: {
      type: Number,
      default: 100, // global threshold for warning
    },
    unit: {
      type: String,
      required: true,
      default: 'Bags', // Bags for Cement, Tons for Steel, Pieces for Bricks, etc.
    },
  },
  {
    timestamps: true,
  }
);

// Search indexes
productSchema.index({ name: 'text', description: 'text' });

const Product = mongoose.model('Product', productSchema);
export default Product;
