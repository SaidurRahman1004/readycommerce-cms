const mongoose = require('mongoose');
const couponSchema = new mongoose.Schema({
  code: { type: String, trim: true, uppercase: true, required: true, unique: true, index: true }, description: String, discountType: { type: String, enum: ['percent', 'fixed'], required: true }, discountValue: { type: Number, required: true, min: 0 }, maxDiscountAmount: { type: Number, min: 0 }, minOrderAmount: { type: Number, min: 0, default: 0 },
  startsAt: { type: Date, required: true }, expiresAt: { type: Date, required: true }, usageLimit: { type: Number, min: 1 }, usedCount: { type: Number, min: 0, default: 0 }, perUserLimit: { type: Number, min: 1, default: 1 }, isActive: { type: Boolean, default: true, index: true },
  applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
}, { timestamps: true });
couponSchema.pre('validate', function validateCoupon(next) { if (this.discountType === 'percent' && this.discountValue > 100) this.invalidate('discountValue', 'Percent discount cannot exceed 100'); next(); });
module.exports = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);
