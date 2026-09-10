const mongoose = require('mongoose');

const paymentSettingSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, index: true }, // For future multi-tenant SaaS architecture
  provider: { 
    type: String, 
    enum: ['stripe', 'sslcommerz', 'bkash', 'manual', 'cod'], 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['online', 'manual', 'cod'], 
    required: true 
  },
  name: { type: String, required: true }, // e.g., "Credit Card", "bKash Personal"
  enabled: { type: Boolean, default: false },
  mode: { type: String, enum: ['test', 'live'], default: 'test' },
  
  // Encrypted JSON string containing API keys/secrets for online gateways
  credentials: { type: String },
  
  // Details for manual payment (legacy single method)
  manualDetails: {
    accountNumber: String,
    accountType: String,
    instructions: String
  },
  
  // Array of dynamic manual payment methods
  manualMethods: [{
    id: { type: String, required: true }, // e.g. 'bkash', 'nagad', 'bank'
    name: { type: String, required: true },
    accountNumber: String,
    accountType: String,
    bankInfo: String,
    instructions: String,
    logo: String,
    enabled: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
  }],
  
  // Details for Cash on Delivery
  codDetails: {
    minAmount: { type: Number, min: 0 },
    maxAmount: { type: Number, min: 0 },
    fee: { type: Number, min: 0, default: 0 }
  },
  
  // Location/Zone restrictions for COD or specific payment methods
  restrictions: {
    allowedLocations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryZone' }]
  },
  
  logo: String,
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

const { encrypt, decrypt } = require('../utils/encryption');

// Ensure one provider configuration per tenant (if tenantId is used, otherwise global)
paymentSettingSchema.index({ tenantId: 1, provider: 1 }, { unique: true });

// Pre-save hook to automatically encrypt credentials
paymentSettingSchema.pre('save', function (next) {
  if (this.isModified('credentials') && this.credentials) {
    try {
      // Check if already encrypted (rough heuristic based on our format iv:authTag:data)
      const parts = this.credentials.split(':');
      if (parts.length !== 3) {
        this.credentials = encrypt(this.credentials);
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Helper method to get decrypted credentials
paymentSettingSchema.methods.getDecryptedCredentials = function () {
  if (!this.credentials) return null;
  try {
    return JSON.parse(decrypt(this.credentials));
  } catch (error) {
    console.error('Failed to decrypt credentials for provider:', this.provider);
    return null;
  }
};

module.exports = mongoose.models.PaymentSetting || mongoose.model('PaymentSetting', paymentSettingSchema);
