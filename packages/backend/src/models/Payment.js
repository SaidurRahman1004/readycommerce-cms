const mongoose = require('mongoose');
const paymentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true }, user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, provider: { type: String, enum: ['bkash', 'nagad', 'cod', 'other'], required: true }, method: String,
  amount: { type: Number, required: true, min: 0 }, currency: { type: String, default: 'BDT', uppercase: true, length: 3 }, transactionId: { type: String, trim: true, sparse: true, unique: true },
  status: { type: String, enum: ['pending', 'processing', 'verified', 'failed', 'cancelled', 'refunded'], default: 'pending', index: true }, verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, verifiedAt: Date, failureReason: String, rawResponse: mongoose.Schema.Types.Mixed,
}, { timestamps: true });
module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
