const mongoose = require('mongoose');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const Inventory = require('../models/Inventory');
const { AppError } = require('../middlewares/errorHandler');
const { client: redis } = require('../config/redis');

const variantData = async (variants) => Promise.all(variants.map(async (variant) => {
  const inventory = await Inventory.findOne({ variant: variant._id }).lean();
  return { ...variant.toObject ? variant.toObject() : variant, stock: inventory?.trackInventory === false ? null : Math.max(0, (inventory?.quantity || 0) - (inventory?.reservedQuantity || 0)) };
}));

const listProducts = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1); const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 12));
    const filter = { status: 'active' }; const { category, minPrice, maxPrice, search, isSpecialOffer, sort = 'featured', scent, color, inStock } = req.query;
    
    const cacheKey = `catalog:products:page=${page}&limit=${limit}&category=${category||''}&minPrice=${minPrice||''}&maxPrice=${maxPrice||''}&search=${search||''}&isSpecialOffer=${isSpecialOffer||''}&sort=${sort}&scent=${scent||''}&color=${color||''}&inStock=${inStock||''}`;
    if (redis && redis.status === 'ready') {
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.set('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
      }
    }

    if (minPrice || maxPrice) filter.basePrice = { ...(minPrice ? { $gte: Number(minPrice) } : {}), ...(maxPrice ? { $lte: Number(maxPrice) } : {}) };
    if (isSpecialOffer === 'true') filter.isSpecialOffer = true;
    if (search) filter.$text = { $search: String(search).trim() };
    if (category) { const categoryDoc = mongoose.isValidObjectId(category) ? category : await require('../models/Category').findOne({ slug: category }).select('_id').lean(); if (!categoryDoc) return res.json({ success: true, data: [], pagination: { page, limit, total: 0, pages: 0 } }); filter.category = categoryDoc._id || categoryDoc; }
    
    const variantFilter = {}; 
    if (scent) variantFilter.scent = String(scent); 
    if (color) variantFilter.color = String(color); 
    if (inStock === 'true') {
      const inventoryItems = await Inventory.find({ $or: [{ trackInventory: false }, { $expr: { $gt: ["$quantity", "$reservedQuantity"] } }] }).select('variant').lean();
      variantFilter._id = { $in: inventoryItems.map(i => i.variant) };
    }
    if (Object.keys(variantFilter).length) { 
      const matchingVariants = await ProductVariant.find(variantFilter).distinct('product'); 
      filter._id = { $in: matchingVariants }; 
    }
    
    const sortMap = { priceLow: { basePrice: 1 }, priceHigh: { basePrice: -1 }, newest: { createdAt: -1 }, featured: { isFeatured: -1, createdAt: -1 }, popular: { createdAt: 1, basePrice: 1 } };
    const [products, total] = await Promise.all([Product.find(filter).populate('category', 'name slug image').sort(sortMap[sort] || sortMap.featured).skip((page - 1) * limit).limit(limit).lean(), Product.countDocuments(filter)]);
    const data = await Promise.all(products.map(async (product) => ({ ...product, variants: await variantData(await ProductVariant.find({ product: product._id, isActive: true })) })));
    
    const responseData = { success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    if (redis && redis.status === 'ready') {
      await redis.setex(cacheKey, 3600, JSON.stringify(responseData)); // 1 hour cache
    }
    res.set('X-Cache', 'MISS');
    return res.json(responseData);
  } catch (error) { return next(error); }
};

const getProduct = async (req, res, next) => {
  try {
    const queryId = req.params.id;
    const cacheKey = `catalog:product:${queryId}`;
    if (redis && redis.status === 'ready') {
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.set('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
      }
    }

    const query = mongoose.isValidObjectId(queryId) ? { _id: queryId } : { slug: queryId };
    const product = await Product.findOne({ ...query, status: 'active' }).populate('category', 'name slug image').lean();
    if (!product) return next(new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND'));
    const variants = await ProductVariant.find({ product: product._id, isActive: true });
    
    const responseData = { success: true, data: { ...product, variants: await variantData(variants) } };
    if (redis && redis.status === 'ready') {
      await redis.setex(cacheKey, 3600, JSON.stringify(responseData)); // 1 hour cache
    }
    res.set('X-Cache', 'MISS');
    return res.json(responseData);
  } catch (error) { return next(error); }
};

const getRelatedProducts = async (req, res, next) => {
  try {
    const queryId = req.params.id;
    const cacheKey = `catalog:product:${queryId}:related`;
    if (redis && redis.status === 'ready') {
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.set('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
      }
    }

    const query = mongoose.isValidObjectId(queryId) ? { _id: queryId } : { slug: queryId };
    const product = await Product.findOne(query).select('category _id').lean();
    if (!product) return next(new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND'));
    
    // Find up to 4 active products in the same category, excluding the current one
    const relatedProducts = await Product.find({ category: product.category, status: 'active', _id: { $ne: product._id } })
      .populate('category', 'name slug image')
      .limit(4)
      .lean();
    
    const data = await Promise.all(relatedProducts.map(async (p) => ({ ...p, variants: await variantData(await ProductVariant.find({ product: p._id, isActive: true })) })));
    
    const responseData = { success: true, data };
    if (redis && redis.status === 'ready') {
      await redis.setex(cacheKey, 3600, JSON.stringify(responseData)); // 1 hour cache
    }
    res.set('X-Cache', 'MISS');
    return res.json(responseData);
  } catch (error) { return next(error); }
};

module.exports = { listProducts, getProduct, getRelatedProducts };
