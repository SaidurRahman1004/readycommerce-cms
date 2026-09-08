const mongoose = require('mongoose');

const manualSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 140 },
  type: { type: String, enum: ['staff_sop', 'customer_guide'], required: true, index: true },
  content: { type: String, required: true, trim: true },
  relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  status: { type: String, enum: ['active', 'draft'], default: 'draft', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

manualSchema.index({ type: 1, status: 1, createdAt: -1 });

module.exports = mongoose.models.Manual || mongoose.model('Manual', manualSchema);
