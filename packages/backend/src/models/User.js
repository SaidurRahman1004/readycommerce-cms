const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: { type: String, trim: true, required: true, maxlength: 60 },
  lastName: { type: String, trim: true, required: true, maxlength: 60 },
  email: { type: String, trim: true, lowercase: true, required: true, unique: true, index: true },
  phone: { type: String, trim: true, maxlength: 25 },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, enum: ['customer', 'admin', 'manager'], default: 'customer', index: true },
  isActive: { type: Boolean, default: true, index: true },
  isEmailVerified: { type: Boolean, default: false },
  lastLoginAt: Date,
  passwordResetTokenHash: { type: String, select: false },
  passwordResetExpiresAt: { type: Date, select: false },
}, { timestamps: true });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  return next();
});
userSchema.methods.comparePassword = function comparePassword(candidate) { return bcrypt.compare(candidate, this.password); };

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
