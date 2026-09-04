const mongoose = require('mongoose');
const orderItemSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true }, product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
  productName: { type: String, required: true }, sku: String, quantity: { type: Number, required: true, min: 1 }, unitPrice: { type: Number, required: true, min: 0 }, discount: { type: Number, min: 0, default: 0 }, total: { type: Number, required: true, min: 0 }, selectedOptions: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });
module.exports = mongoose.models.OrderItem || mongoose.model('OrderItem', orderItemSchema);
