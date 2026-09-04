const mongoose = require('mongoose');
const inventorySchema = new mongoose.Schema({
  variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true, unique: true, index: true },
  quantity: { type: Number, min: 0, default: 0 }, reservedQuantity: { type: Number, min: 0, default: 0 }, lowStockThreshold: { type: Number, min: 0, default: 5 },
  trackInventory: { type: Boolean, default: true }, lastRestockedAt: Date,
}, { timestamps: true });
inventorySchema.virtual('availableQuantity').get(function availableQuantity() { return Math.max(0, this.quantity - this.reservedQuantity); });
inventorySchema.set('toJSON', { virtuals: true });
module.exports = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);
