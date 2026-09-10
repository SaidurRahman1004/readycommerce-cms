const mongoose = require('mongoose');
const paymentSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, index: true }, // For future multi-tenant SaaS architecture
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true }, 
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  provider: { type: String, required: true }, // e.g. 'stripe', 'sslcommerz', 'bkash', 'manual', 'cod'
  method: String, // e.g. 'credit_card', 'bkash_personal'
  amount: { type: Number, required: true, min: 0 }, 
  currency: { type: String, default: 'BDT', uppercase: true, length: 3 }, 
  transactionId: { type: String, trim: true, sparse: true, index: true },
  status: { 
    type: String, 
    enum: [
      'pending', 'processing', 'paid', 'failed', 'cancelled', 'expired', 'refunded', 'partially_refunded', 
      'submitted', 'under_review', 'approved', 'rejected'
    ], 
    default: 'pending', 
    index: true 
  },
  mode: { type: String, enum: ['test', 'live'], default: 'test' },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  verifiedAt: Date, 
  paidAt: Date,
  failedAt: Date,
  failureReason: String, 
  rawResponse: mongoose.Schema.Types.Mixed, // Legacy/general raw response
  providerResponse: mongoose.Schema.Types.Mixed, // Structured provider response/webhook data
  metadata: mongoose.Schema.Types.Mixed // Custom metadata for the payment
}, { timestamps: true });
module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
