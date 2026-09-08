const crypto = require('crypto');
const Joi = require('joi');
const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');
const Product = require('../models/Product');
const { AppError } = require('../middlewares/errorHandler');
const { client: redis } = require('../config/redis');
const { computeLiveStatus } = require('./campaignController');

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const campaignValidationSchema = Joi.object({
  title: Joi.string().trim().min(3).max(180).required(),
  slug: Joi.string().trim().lowercase().pattern(slugRegex).max(120).optional(),
  product: Joi.string().custom((value, helpers) => {
    if (!mongoose.isValidObjectId(value)) return helpers.error('any.invalid');
    return value;
  }).required(),
  selectedVariants: Joi.array().items(Joi.string().custom((value, helpers) => {
    if (!mongoose.isValidObjectId(value)) return helpers.error('any.invalid');
    return value;
  })).default([]),
  headline: Joi.string().trim().max(250).allow('', null),
  subheadline: Joi.string().trim().max(500).allow('', null),
  badgeText: Joi.string().trim().max(80).default('LIMITED TIME OFFER'),
  offerPrice: Joi.number().min(0).allow(null),
  discountPercentage: Joi.number().min(0).max(100).allow(null),
  ctaText: Joi.string().trim().max(80).default('Order Now - Limited Stock'),
  ctaSubtext: Joi.string().trim().max(150).default('Free Delivery Across Bangladesh'),
  bannerImage: Joi.string().trim().allow('', null),
  mobileBannerImage: Joi.string().trim().allow('', null),
  galleryImages: Joi.array().items(Joi.string().trim()).default([]),
  benefits: Joi.array().items(Joi.object({
    icon: Joi.string().trim().default('CheckCircle'),
    title: Joi.string().trim().max(120).required(),
    description: Joi.string().trim().max(300).allow('', null),
  })).default([]),
  specifications: Joi.array().items(Joi.object({
    label: Joi.string().trim().max(100).required(),
    value: Joi.string().trim().max(250).required(),
  })).default([]),
  startsAt: Joi.date().iso().required(),
  expiresAt: Joi.date().iso().greater(Joi.ref('startsAt')).required()
    .messages({ 'date.greater': 'Campaign end date must be strictly after start date.' }),
  showCountdown: Joi.boolean().default(true),
  status: Joi.string().valid('draft', 'active', 'scheduled', 'archived').default('draft'),
  publishImmediately: Joi.boolean().default(false),
  onExpiryAction: Joi.string().valid('show_expired_page', 'redirect_product', 'redirect_home').default('show_expired_page'),
  recommendedProducts: Joi.array().items(Joi.string().custom((value, helpers) => {
    if (!mongoose.isValidObjectId(value)) return helpers.error('any.invalid');
    return value;
  })).default([]),
  seo: Joi.object({
    metaTitle: Joi.string().trim().max(150).allow('', null),
    metaDescription: Joi.string().trim().max(320).allow('', null),
    canonicalUrl: Joi.string().trim().max(500).allow('', null),
    ogTitle: Joi.string().trim().max(150).allow('', null),
    ogDescription: Joi.string().trim().max(320).allow('', null),
    ogImage: Joi.string().trim().allow('', null),
    twitterCard: Joi.string().trim().default('summary_large_image'),
  }).default({}),
});

const generateUniqueSlug = async (title, existingId = null) => {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'campaign';

  let candidate = base;
  let counter = 1;

  while (await Campaign.exists({ slug: candidate, ...(existingId ? { _id: { $ne: existingId } } : {}) })) {
    candidate = `${base}-${counter}`;
    counter++;
  }
  return candidate;
};

const invalidateCampaignCache = async (slug) => {
  if (redis && redis.status === 'ready' && slug) {
    try {
      await redis.del(`campaign:slug:${slug}`);
    } catch {
      // Non-blocking cache error
    }
  }
};

const listCampaigns = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const { status, search, sort = 'newest' } = req.query;

    const filter = {};
    if (status && ['draft', 'scheduled', 'active', 'expired', 'archived'].includes(status)) {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: String(search).trim(), $options: 'i' } },
        { slug: { $regex: String(search).trim(), $options: 'i' } },
        { headline: { $regex: String(search).trim(), $options: 'i' } },
      ];
    }

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      startsAt: { startsAt: 1 },
      expiresAt: { expiresAt: 1 },
    };

    const [campaigns, total] = await Promise.all([
      Campaign.find(filter)
        .populate('product', 'name basePrice images')
        .populate('createdBy', 'firstName lastName email')
        .sort(sortMap[sort] || sortMap.newest)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Campaign.countDocuments(filter),
    ]);

    const data = campaigns.map((campaign) => ({
      ...campaign,
      liveStatus: computeLiveStatus(campaign),
    }));

    return res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return next(new AppError('Invalid campaign ID.', 400, 'INVALID_ID'));
    }

    const campaign = await Campaign.findById(id)
      .populate('product', 'name basePrice discountPrice images category variants')
      .populate('recommendedProducts', 'name basePrice images')
      .lean();

    if (!campaign) {
      return next(new AppError('Campaign not found.', 404, 'CAMPAIGN_NOT_FOUND'));
    }

    return res.json({
      success: true,
      data: {
        ...campaign,
        liveStatus: computeLiveStatus(campaign),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const createCampaign = async (req, res, next) => {
  try {
    const { error, value } = campaignValidationSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return next(new AppError(error.details.map((d) => d.message).join('; '), 400, 'VALIDATION_ERROR'));
    }

    const productExists = await Product.exists({ _id: value.product, status: { $ne: 'archived' } });
    if (!productExists) {
      return next(new AppError('Associated product not found or is archived.', 404, 'PRODUCT_NOT_FOUND'));
    }

    const slug = value.slug ? value.slug.toLowerCase().trim() : await generateUniqueSlug(value.title);
    if (await Campaign.exists({ slug })) {
      return next(new AppError('A campaign with this URL slug already exists. Please choose a unique slug.', 409, 'SLUG_EXISTS'));
    }

    const now = new Date();
    let finalStatus = value.status || 'draft';
    let finalStartsAt = value.startsAt;

    if (value.publishImmediately || value.status === 'active') {
      finalStatus = 'active';
      // If startsAt was set for today or in the future, bring it to now so it is active immediately
      if (new Date(finalStartsAt) > now) {
        finalStartsAt = new Date(now.getTime() - 1000);
      }
    }

    const previewToken = crypto.randomUUID();

    const campaign = await Campaign.create({
      ...value,
      startsAt: finalStartsAt,
      slug,
      status: finalStatus,
      previewToken,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: finalStatus === 'active' ? 'Campaign published and is now live!' : 'Campaign saved as draft.',
      data: campaign,
    });
  } catch (error) {
    return next(error);
  }
};

const updateCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return next(new AppError('Invalid campaign ID.', 400, 'INVALID_ID'));
    }

    const existing = await Campaign.findById(id);
    if (!existing) {
      return next(new AppError('Campaign not found.', 404, 'CAMPAIGN_NOT_FOUND'));
    }

    const { error, value } = campaignValidationSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return next(new AppError(error.details.map((d) => d.message).join('; '), 400, 'VALIDATION_ERROR'));
    }

    const targetSlug = value.slug ? value.slug.toLowerCase().trim() : existing.slug;
    if (targetSlug !== existing.slug) {
      const slugTaken = await Campaign.exists({ slug: targetSlug, _id: { $ne: id } });
      if (slugTaken) {
        return next(new AppError('A campaign with this URL slug already exists.', 409, 'SLUG_EXISTS'));
      }
    }

    const previousSlug = existing.slug;
    const now = new Date();
    let finalStartsAt = value.startsAt !== undefined ? value.startsAt : existing.startsAt;
    let finalStatus = value.status !== undefined ? value.status : existing.status;

    if (value.publishImmediately || value.status === 'active') {
      finalStatus = 'active';
      if (new Date(finalStartsAt) > now) {
        finalStartsAt = new Date(now.getTime() - 1000);
      }
    }

    Object.assign(existing, value, {
      slug: targetSlug,
      startsAt: finalStartsAt,
      status: finalStatus,
      updatedBy: req.user._id,
    });

    await existing.save();

    await invalidateCampaignCache(previousSlug);
    if (targetSlug !== previousSlug) {
      await invalidateCampaignCache(targetSlug);
    }

    return res.json({
      success: true,
      message: 'Campaign updated successfully.',
      data: existing,
    });
  } catch (error) {
    return next(error);
  }
};

const publishCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);
    if (!campaign) return next(new AppError('Campaign not found.', 404, 'CAMPAIGN_NOT_FOUND'));

    const now = new Date();
    if (now > new Date(campaign.expiresAt)) {
      return next(new AppError('Cannot publish an expired campaign. Please update the expiry date first.', 400, 'CAMPAIGN_ALREADY_EXPIRED'));
    }

    // When the admin explicitly clicks "Publish Campaign", make it active immediately!
    // If startsAt was set in the future or today, clamp startsAt to now so it is active immediately.
    if (new Date(campaign.startsAt) > now) {
      campaign.startsAt = new Date(now.getTime() - 1000);
    }

    campaign.status = 'active';
    campaign.updatedBy = req.user._id;
    await campaign.save();

    await invalidateCampaignCache(campaign.slug);

    return res.json({
      success: true,
      message: 'Campaign published and is now live!',
      data: { status: 'active', liveStatus: computeLiveStatus(campaign) },
    });
  } catch (error) {
    return next(error);
  }
};

const unpublishCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);
    if (!campaign) return next(new AppError('Campaign not found.', 404, 'CAMPAIGN_NOT_FOUND'));

    campaign.status = 'draft';
    campaign.updatedBy = req.user._id;
    await campaign.save();

    await invalidateCampaignCache(campaign.slug);

    return res.json({
      success: true,
      message: 'Campaign unpublished and returned to draft.',
      data: { status: 'draft' },
    });
  } catch (error) {
    return next(error);
  }
};

const duplicateCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const original = await Campaign.findById(id).lean();
    if (!original) return next(new AppError('Campaign not found.', 404, 'CAMPAIGN_NOT_FOUND'));

    const newSlug = await generateUniqueSlug(`${original.slug}-copy`);
    const previewToken = crypto.randomUUID();

    const cloneData = {
      ...original,
      _id: new mongoose.Types.ObjectId(),
      title: `${original.title} (Copy)`,
      slug: newSlug,
      status: 'draft',
      previewToken,
      analytics: { views: 0, clicks: 0, conversions: 0 },
      createdBy: req.user._id,
      updatedBy: req.user._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const clone = await Campaign.create(cloneData);

    return res.status(201).json({
      success: true,
      message: 'Campaign duplicated into a new draft.',
      data: clone,
    });
  } catch (error) {
    return next(error);
  }
};

const archiveCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);
    if (!campaign) return next(new AppError('Campaign not found.', 404, 'CAMPAIGN_NOT_FOUND'));

    campaign.status = 'archived';
    campaign.updatedBy = req.user._id;
    await campaign.save();

    await invalidateCampaignCache(campaign.slug);

    return res.json({
      success: true,
      message: 'Campaign archived.',
      data: { status: 'archived' },
    });
  } catch (error) {
    return next(error);
  }
};

const deleteCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);
    if (!campaign) return next(new AppError('Campaign not found.', 404, 'CAMPAIGN_NOT_FOUND'));

    const slug = campaign.slug;
    await campaign.deleteOne();
    await invalidateCampaignCache(slug);

    return res.json({
      success: true,
      message: 'Campaign permanently deleted.',
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  publishCampaign,
  unpublishCampaign,
  duplicateCampaign,
  archiveCampaign,
  deleteCampaign,
};
