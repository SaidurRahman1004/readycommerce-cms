const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['shipping', 'billing'], default: 'shipping' },
  label: { type: String, trim: true, default: 'Home', maxlength: 40 },
  recipientName: { type: String, trim: true, required: true, maxlength: 120 },
  phone: { type: String, trim: true, required: true, maxlength: 25 },
  addressLine1: { type: String, trim: true, required: true, maxlength: 200 },
  addressLine2: { type: String, trim: true, maxlength: 200 },
  city: { type: String, trim: true, required: true, maxlength: 80 },
  state: { type: String, trim: true, maxlength: 80 },
  postalCode: { type: String, trim: true, required: true, maxlength: 20 },
  country: { type: String, trim: true, default: 'Bangladesh', maxlength: 80 },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });
addressSchema.index({ user: 1, type: 1, isDefault: 1 });
module.exports = mongoose.models.Address || mongoose.model('Address', addressSchema);
