const mongoose = require('mongoose');
const addressSnapshot = new mongoose.Schema({ recipientName: String, phone: String, addressLine1: String, addressLine2: String, city: String, state: String, postalCode: String, country: String }, { _id: false });
const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true, index: true }, user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, email: { type: String, required: true, lowercase: true },
  status: { type: String, enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'failed', 'returned', 'refunded'], default: 'pending', index: true },
  paymentStatus: { type: String, enum: ['pending', 'authorized', 'paid', 'failed', 'refunded', 'partially_refunded'], default: 'pending' }, currency: { type: String, default: 'BDT', uppercase: true, length: 3 },
  subtotal: { type: Number, required: true, min: 0 }, discount: { type: Number, min: 0, default: 0 }, shipping: { type: Number, min: 0, default: 0 }, tax: { type: Number, min: 0, default: 0 }, total: { type: Number, required: true, min: 0 }, totalAmount: { type: Number, required: true, min: 0 },
  shippingAddress: { type: addressSnapshot, required: true }, billingAddress: addressSnapshot, shippingMethod: String, trackingNumber: String, carrier: String, notes: String,
  placedAt: { type: Date, default: Date.now }, paidAt: Date, deliveredAt: Date, cancelledAt: Date,
}, { timestamps: true });
orderSchema.index({ user: 1, createdAt: -1 });
module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
