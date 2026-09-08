const crypto = require('crypto');
const Campaign = require('../models/Campaign');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const Inventory = require('../models/Inventory');
const { AppError } = require('../middlewares/errorHandler');
const { client: redis } = require('../config/redis');

const computeLiveStatus = (campaign, now = new Date()) => {
  if (campaign.status === 'draft' || campaign.status === 'archived') {
    return campaign.status;
  }
  const startTime = new Date(campaign.startsAt).getTime();
  const expiryTime = new Date(campaign.expiresAt).getTime();
  const currentTime = now.getTime();

  // Fail closed for legacy or malformed records instead of treating them as live.
  if (!Number.isFinite(startTime) || !Number.isFinite(expiryTime) || expiryTime <= startTime) {
    return 'expired';
  }

  if (currentTime > expiryTime) {
    return 'expired';
  }

  // If status is explicitly active, don't let clock skew or start-of-day/future-hour timezone offset block it
  if (campaign.status === 'active') {
    return 'active';
  }

  // If status is scheduled or start time is still in the future (beyond 5m grace), it's scheduled
  if (campaign.status === 'scheduled' || currentTime < startTime - (5 * 60 * 1000)) {
    return 'scheduled';
  }

  return 'active';
};

const populateVariantsWithStock = async (variants) => {
  return Promise.all(
    variants.map(async (variant) => {
      const inventory = await Inventory.findOne({ variant: variant._id }).lean();
      const available = inventory?.trackInventory === false
        ? null
        : Math.max(0, (inventory?.quantity || 0) - (inventory?.reservedQuantity || 0));
      return {
        ...variant,
        stock: available,
      };
    })
  );
};

const resolveRecommendedProducts = async (campaign, currentProduct) => {
  if (campaign.recommendedProducts && campaign.recommendedProducts.length > 0) {
    const recs = await Product.find({
      _id: { $in: campaign.recommendedProducts },
      status: 'active',
    })
      .select('name slug basePrice discountPrice images category ratingAverage reviewCount')
      .populate('category', 'name slug image')
      .lean();
    if (recs.length > 0) return recs;
  }

  // Fallback: Level 1 Category & Tag Matching
  const query = {
    _id: { $ne: currentProduct._id },
    status: 'active',
  };
  if (currentProduct.category) {
    query.category = currentProduct.category._id || currentProduct.category;
  }

  return Product.find(query)
    .select('name slug basePrice discountPrice images category ratingAverage reviewCount')
    .populate('category', 'name slug image')
    .sort({ ratingAverage: -1, createdAt: -1 })
    .limit(4)
    .lean();
};

const serializeCampaignResponse = async (campaignDoc, liveStatus) => {
  const product = campaignDoc.product;
  const rawVariants = await ProductVariant.find({
    product: product._id,
    isActive: true,
    ...(campaignDoc.selectedVariants?.length ? { _id: { $in: campaignDoc.selectedVariants } } : {}),
  }).lean();

  const variants = await populateVariantsWithStock(rawVariants);
  const recommended = await resolveRecommendedProducts(campaignDoc, product);

  // Runtime Fallback Merging (Zero Data Duplication)
  const effectiveHeadline = campaignDoc.headline || product.name;
  const effectiveSubheadline = campaignDoc.subheadline || product.shortDescription || product.description || '';
  const effectiveOfferPrice = campaignDoc.offerPrice ?? (product.discountPrice || product.basePrice);
  const effectiveBannerImage = campaignDoc.bannerImage || product.images?.[0] || '';
  const effectiveMobileBannerImage = campaignDoc.mobileBannerImage || effectiveBannerImage;
  const effectiveGallery = campaignDoc.galleryImages?.length ? campaignDoc.galleryImages : (product.images || []);
  const effectiveSpecifications = campaignDoc.specifications?.length ? campaignDoc.specifications : (product.specifications || []);

  const totalStock = variants.reduce((sum, v) => sum + (v.stock ?? 999), 0);

  return {
    _id: campaignDoc._id,
    title: campaignDoc.title,
    slug: campaignDoc.slug,
    status: liveStatus,
    configuredStatus: campaignDoc.status,
    startsAt: campaignDoc.startsAt,
    expiresAt: campaignDoc.expiresAt,
    serverTime: new Date().toISOString(),
    showCountdown: campaignDoc.showCountdown,
    onExpiryAction: campaignDoc.onExpiryAction,
    badgeText: campaignDoc.badgeText || 'LIMITED TIME OFFER',
    headline: effectiveHeadline,
    subheadline: effectiveSubheadline,
    offerPrice: effectiveOfferPrice,
    regularPrice: product.basePrice,
    discountPercentage: campaignDoc.discountPercentage || (product.basePrice > effectiveOfferPrice ? Math.round(((product.basePrice - effectiveOfferPrice) / product.basePrice) * 100) : 0),
    ctaText: campaignDoc.ctaText || 'Order Now - Limited Stock',
    ctaSubtext: campaignDoc.ctaSubtext || 'Free Delivery Across Bangladesh',
    bannerImage: effectiveBannerImage,
    mobileBannerImage: effectiveMobileBannerImage,
    galleryImages: effectiveGallery,
    benefits: campaignDoc.benefits || [],
    specifications: effectiveSpecifications,
    product: {
      _id: product._id,
      name: product.name,
      slug: product.slug,
      ratingAverage: product.ratingAverage || 0,
      reviewCount: product.reviewCount || 0,
      category: product.category,
      variants,
      inStock: totalStock > 0,
    },
    recommendedProducts: recommended,
    seo: {
      metaTitle: campaignDoc.seo?.metaTitle || `${effectiveHeadline} | ReadyCommerce Offer`,
      metaDescription: campaignDoc.seo?.metaDescription || effectiveSubheadline.slice(0, 160),
      canonicalUrl: campaignDoc.seo?.canonicalUrl || '',
      ogTitle: campaignDoc.seo?.ogTitle || effectiveHeadline,
      ogDescription: campaignDoc.seo?.ogDescription || effectiveSubheadline.slice(0, 160),
      ogImage: campaignDoc.seo?.ogImage || effectiveBannerImage,
      twitterCard: campaignDoc.seo?.twitterCard || 'summary_large_image',
    },
  };
};

const getPublicCampaign = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const token = req.query.token || req.query.previewToken || req.query.preview_token;
    const cacheKey = `campaign:slug:${slug}`;

    if (!token && redis && redis.status === 'ready') {
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.set('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
      }
    }

    const campaign = await Campaign.findOne({ slug })
      .populate({
        path: 'product',
        populate: { path: 'category', select: 'name slug image' },
      });

    if (!campaign || !campaign.product) {
      return next(new AppError('Campaign not found.', 404, 'CAMPAIGN_NOT_FOUND'));
    }

    const liveStatus = computeLiveStatus(campaign);
    const isTokenPreview = Boolean(token && campaign.previewToken && token === campaign.previewToken);

    if (!isTokenPreview) {
      if (liveStatus === 'draft' || liveStatus === 'archived') {
        return next(new AppError('Campaign not found.', 404, 'CAMPAIGN_NOT_FOUND'));
      }

      if (liveStatus === 'scheduled') {
        return next(new AppError('This campaign has not started yet.', 404, 'CAMPAIGN_NOT_STARTED'));
      }

      if (liveStatus === 'expired' && campaign.onExpiryAction !== 'show_expired_page') {
        return res.json({
          success: true,
          data: {
            expired: true,
            action: campaign.onExpiryAction,
            targetUrl: campaign.onExpiryAction === 'redirect_product' ? `/products/${campaign.product._id}` : '/',
          },
        });
      }
    }

    const serialized = await serializeCampaignResponse(campaign, liveStatus);
    if (isTokenPreview) {
      serialized.isPreview = true;
    }

    const responseData = {
      success: true,
      data: serialized,
    };

    if (!isTokenPreview && redis && redis.status === 'ready' && liveStatus === 'active') {
      await redis.setex(cacheKey, 3600, JSON.stringify(responseData));
    }

    // Non-blocking view count increment
    Campaign.updateOne({ _id: campaign._id }, { $inc: { 'analytics.views': 1 } }).catch(() => {});

    res.set('X-Cache', 'MISS');
    return res.json(responseData);
  } catch (error) {
    return next(error);
  }
};

const getPreviewCampaign = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { token } = req.query;

    const campaign = await Campaign.findOne({ slug })
      .populate({
        path: 'product',
        populate: { path: 'category', select: 'name slug image' },
      });

    if (!campaign || !campaign.product) {
      return next(new AppError('Campaign not found.', 404, 'CAMPAIGN_NOT_FOUND'));
    }

    const isTokenValid = token && campaign.previewToken && token === campaign.previewToken;
    const isAdminUser = req.user && ['super-admin', 'manager', 'editor'].includes(req.user.role);

    if (!isTokenValid && !isAdminUser) {
      return next(new AppError('Unauthorized preview access.', 403, 'PREVIEW_UNAUTHORIZED'));
    }

    const liveStatus = computeLiveStatus(campaign);

    return res.json({
      success: true,
      isPreview: true,
      data: await serializeCampaignResponse(campaign, liveStatus),
    });
  } catch (error) {
    return next(error);
  }
};

const trackCampaignAction = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { action, actionType } = req.body;
    const requestedAction = action || actionType;

    const fieldMap = {
      view: 'analytics.views',
      click: 'analytics.clicks',
      cta_click: 'analytics.clicks',
      add_to_cart: 'analytics.clicks',
      checkout: 'analytics.conversions',
      conversion: 'analytics.conversions',
    };
    const field = fieldMap[requestedAction];
    if (!field) {
      return next(new AppError('Invalid tracking action.', 400, 'INVALID_ACTION'));
    }

    const result = await Campaign.updateOne({ slug }, { $inc: { [field]: 1 } });
    if (!result.matchedCount) return next(new AppError('Campaign not found.', 404, 'CAMPAIGN_NOT_FOUND'));

    return res.json({ success: true, message: 'Event tracked.' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getPublicCampaign,
  getPreviewCampaign,
  trackCampaignAction,
  computeLiveStatus,
};
