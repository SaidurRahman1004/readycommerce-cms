const mongoose = require('mongoose');
const categorySchema = new mongoose.Schema({
  name: { type: String, trim: true, required: true, maxlength: 100 }, slug: { type: String, trim: true, lowercase: true, required: true, unique: true },
  description: { type: String, trim: true, maxlength: 500 }, image: String,
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
  isActive: { type: Boolean, default: true, index: true }, sortOrder: { type: Number, default: 0 },
}, { timestamps: true });
module.exports = mongoose.models.Category || mongoose.model('Category', categorySchema);
