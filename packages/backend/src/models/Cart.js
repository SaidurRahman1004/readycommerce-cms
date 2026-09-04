const mongoose = require('mongoose');
const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true }, sessionId: { type: String, unique: true, sparse: true, index: true },
  status: { type: String, enum: ['active', 'converted', 'abandoned'], default: 'active', index: true }, currency: { type: String, default: 'BDT', uppercase: true, length: 3 },
  subtotal: { type: Number, min: 0, default: 0 }, discount: { type: Number, min: 0, default: 0 }, shipping: { type: Number, min: 0, default: 0 }, tax: { type: Number, min: 0, default: 0 }, total: { type: Number, min: 0, default: 0 },
  appliedCoupons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' }],
}, { timestamps: true });
module.exports = mongoose.models.Cart || mongoose.model('Cart', cartSchema);
