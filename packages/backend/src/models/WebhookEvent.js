const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema({
  provider: { type: String, required: true },
  eventId: { type: String, required: true }, // Unique event ID from the provider (e.g., Stripe event ID)
  status: { 
    type: String, 
    enum: ['pending', 'processed', 'failed'], 
    default: 'pending' 
  },
  payload: { type: mongoose.Schema.Types.Mixed }, // The full webhook payload
  error: { type: String } // Any error message if processing failed
}, { timestamps: true });

// Prevent duplicate event IDs for the same provider
webhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.models.WebhookEvent || mongoose.model('WebhookEvent', webhookEventSchema);
