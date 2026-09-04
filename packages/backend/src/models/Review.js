const mongoose = require('mongoose');
const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true }, user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  rating: { type: Number, required: true, min: 1, max: 5 }, title: { type: String, trim: true, maxlength: 120 }, body: { type: String, trim: true, required: true, maxlength: 2000 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true }, isVerifiedPurchase: { type: Boolean, default: false }, moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, moderatedAt: Date,
}, { timestamps: true });
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
module.exports = mongoose.models.Review || mongoose.model('Review', reviewSchema);
