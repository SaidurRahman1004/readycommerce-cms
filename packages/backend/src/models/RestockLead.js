const mongoose = require('mongoose');

const restockLeadSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 255,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true,
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariant',
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'notified', 'cancelled'],
    default: 'pending',
    index: true,
  },
}, { timestamps: true });

// Prevent duplicate restock requests for the same email + product + variant
restockLeadSchema.index({ email: 1, productId: 1, variantId: 1 }, { unique: true });

module.exports = mongoose.models.RestockLead || mongoose.model('RestockLead', restockLeadSchema);
