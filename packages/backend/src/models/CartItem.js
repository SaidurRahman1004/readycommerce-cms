const mongoose = require('mongoose');
const cartItemSchema = new mongoose.Schema({
  cart: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart', required: true, index: true }, product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
  quantity: { type: Number, required: true, min: 1 }, unitPrice: { type: Number, required: true, min: 0 }, productName: { type: String, required: true }, sku: String, imageSnapshot: String,
}, { timestamps: true });
cartItemSchema.index({ cart: 1, product: 1, variant: 1 });
module.exports = mongoose.models.CartItem || mongoose.model('CartItem', cartItemSchema);
