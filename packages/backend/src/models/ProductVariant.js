const mongoose = require('mongoose');
const variantSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true }, sku: { type: String, trim: true, uppercase: true, required: true, unique: true },
  name: { type: String, trim: true, required: true, maxlength: 120 }, size: String, color: String,
  attributes: { type: mongoose.Schema.Types.Mixed, default: {} }, price: { type: Number, required: true, min: 0 }, compareAtPrice: { type: Number, min: 0 },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });
module.exports = mongoose.models.ProductVariant || mongoose.model('ProductVariant', variantSchema);
