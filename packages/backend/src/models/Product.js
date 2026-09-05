const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: true, maxlength: 180 }, slug: { type: String, trim: true, lowercase: true, required: true, unique: true },
  shortDescription: { type: String, trim: true, maxlength: 300 }, description: { type: String, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true }, brand: { type: String, trim: true, maxlength: 100 },
  basePrice: { type: Number, required: true, min: 0 }, currency: { type: String, default: 'BDT', uppercase: true, length: 3 },
  images: [{ type: String, trim: true }], tags: [{ type: String, trim: true, lowercase: true }],
  status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft', index: true }, isFeatured: { type: Boolean, default: false },
  isSpecialOffer: { type: Boolean, default: false, index: true }, discountPrice: { type: Number, min: 0 },
  ratingAverage: { type: Number, min: 0, max: 5, default: 0 }, reviewCount: { type: Number, min: 0, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
