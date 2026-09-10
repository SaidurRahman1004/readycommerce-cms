const mongoose = require('mongoose');

const deliveryZoneSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, index: true },
  name: { type: String, required: true, trim: true }, // e.g., "Inside Dhaka", "Outside Dhaka"
  type: { 
    type: String, 
    enum: ['country', 'state', 'city', 'area', 'custom_zone'], 
    default: 'custom_zone' 
  },
  postalCodes: [{ type: String, trim: true }], // Specific zip/postal codes inside this zone
  isActive: { type: Boolean, default: true },
  deliveryCharge: { type: Number, min: 0, required: true },
  codAvailable: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure unique zone name per tenant
deliveryZoneSchema.index({ tenantId: 1, name: 1 }, { unique: true });

module.exports = mongoose.models.DeliveryZone || mongoose.model('DeliveryZone', deliveryZoneSchema);
