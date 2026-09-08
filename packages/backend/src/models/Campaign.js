const mongoose = require('mongoose');
const crypto = require('crypto');

const benefitSchema = new mongoose.Schema({
  icon: { type: String, trim: true, default: 'CheckCircle' },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 300 },
}, { _id: false });

const specSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true, maxlength: 100 },
  value: { type: String, required: true, trim: true, maxlength: 250 },
}, { _id: false });

const seoSchema = new mongoose.Schema({
  metaTitle: { type: String, trim: true, maxlength: 150 },
  metaDescription: { type: String, trim: true, maxlength: 320 },
  canonicalUrl: { type: String, trim: true, maxlength: 500 },
  ogTitle: { type: String, trim: true, maxlength: 150 },
  ogDescription: { type: String, trim: true, maxlength: 320 },
  ogImage: { type: String, trim: true },
  twitterCard: { type: String, trim: true, default: 'summary_large_image' },
}, { _id: false });

const analyticsSchema = new mongoose.Schema({
  views: { type: Number, default: 0, min: 0 },
  clicks: { type: Number, default: 0, min: 0 },
  conversions: { type: Number, default: 0, min: 0 },
}, { _id: false });

const campaignSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  slug: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    index: true,
    maxlength: 120,
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'expired', 'archived'],
    default: 'draft',
    index: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true,
  },
  selectedVariants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariant',
  }],

  // Marketing & Hero Copy
  headline: { type: String, trim: true, maxlength: 250 },
  subheadline: { type: String, trim: true, maxlength: 500 },
  badgeText: { type: String, trim: true, maxlength: 80, default: 'LIMITED TIME OFFER' },

  // Pricing & Promotion
  offerPrice: { type: Number, min: 0 },
  discountPercentage: { type: Number, min: 0, max: 100 },
  ctaText: { type: String, trim: true, maxlength: 80, default: 'Order Now - Limited Stock' },
  ctaSubtext: { type: String, trim: true, maxlength: 150, default: 'Free Delivery Across Bangladesh' },

  // Visual Media
  bannerImage: { type: String, trim: true },
  mobileBannerImage: { type: String, trim: true },
  galleryImages: [{ type: String, trim: true }],

  // Value Props & Specs
  benefits: [benefitSchema],
  specifications: [specSchema],

  // Schedule & Timing
  startsAt: { type: Date, required: true, index: true },
  expiresAt: { type: Date, required: true, index: true },
  showCountdown: { type: Boolean, default: true },
  onExpiryAction: {
    type: String,
    enum: ['show_expired_page', 'redirect_product', 'redirect_home'],
    default: 'show_expired_page',
  },

  // Cross-sell Recommendations
  recommendedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],

  // SEO & Social Metadata
  seo: { type: seoSchema, default: () => ({}) },

  // Preview Security
  previewToken: { type: String, trim: true, index: true, default: () => crypto.randomUUID() },

  // Analytics Pre-wiring
  analytics: { type: analyticsSchema, default: () => ({ views: 0, clicks: 0, conversions: 0 }) },

  // Audit info
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

campaignSchema.index({ status: 1, startsAt: 1, expiresAt: 1 });
campaignSchema.index({ title: 'text', headline: 'text', slug: 'text' });

module.exports = mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema);
