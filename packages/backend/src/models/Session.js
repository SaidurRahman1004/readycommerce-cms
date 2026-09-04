const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true, select: false },
  expiresAt: { type: Date, required: true, index: true },
  revokedAt: Date,
  userAgent: { type: String, maxlength: 500 },
  ipAddress: { type: String, maxlength: 100 },
}, { timestamps: true });

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
module.exports = mongoose.models.Session || mongoose.model('Session', sessionSchema);
