const mongoose = require('mongoose');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const Inventory = require('../models/Inventory');
const { AppError } = require('../middlewares/errorHandler');

const variantData = async (variants) => Promise.all(variants.map(async (variant) => {
  const inventory = await Inventory.findOne({ variant: variant._id }).lean();
  return { ...variant.toObject ? variant.toObject() : variant, stock: inventory?.trackInventory === false ? null : Math.max(0, (inventory?.quantity || 0) - (inventory?.reservedQuantity || 0)) };
}));

const listProducts = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1); const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 12));
    const filter = { status: 'active' }; const { category, minPrice, maxPrice, search, isSpecialOffer, sort = 'featured' } = req.query;
    if (minPrice || maxPrice) filter.basePrice = { ...(minPrice ? { $gte: Number(minPrice) } : {}), ...(maxPrice ? { $lte: Number(maxPrice) } : {}) };
    if (isSpecialOffer === 'true') filter.isSpecialOffer = true;
    if (search) filter.$text = { $search: String(search).trim() };
    if (category) { const categoryDoc = mongoose.isValidObjectId(category) ? category : await require('../models/Category').findOne({ slug: category }).select('_id').lean(); if (!categoryDoc) return res.json({ success: true, data: [], pagination: { page, limit, total: 0, pages: 0 } }); filter.category = categoryDoc._id || categoryDoc; }
    const variantFilter = {}; if (req.query.scent) variantFilter.scent = String(req.query.scent); if (req.query.color) variantFilter.color = String(req.query.color); if (Object.keys(variantFilter).length) { const matchingVariants = await ProductVariant.find(variantFilter).distinct('product'); filter._id = { $in: matchingVariants }; }
    const sortMap = { priceLow: { basePrice: 1 }, priceHigh: { basePrice: -1 }, newest: { createdAt: -1 }, featured: { isFeatured: -1, createdAt: -1 } };
    const [products, total] = await Promise.all([Product.find(filter).populate('category', 'name slug image').sort(sortMap[sort] || sortMap.featured).skip((page - 1) * limit).limit(limit).lean(), Product.countDocuments(filter)]);
    const data = await Promise.all(products.map(async (product) => ({ ...product, variants: await variantData(await ProductVariant.find({ product: product._id, isActive: true })) })));
    return res.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { return next(error); }
};

const getProduct = async (req, res, next) => {
  try {
    const query = mongoose.isValidObjectId(req.params.id) ? { _id: req.params.id } : { slug: req.params.id };
    const product = await Product.findOne({ ...query, status: 'active' }).populate('category', 'name slug image').lean();
    if (!product) return next(new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND'));
    const variants = await ProductVariant.find({ product: product._id, isActive: true });
    return res.json({ success: true, data: { ...product, variants: await variantData(variants) } });
  } catch (error) { return next(error); }
};

module.exports = { listProducts, getProduct };
