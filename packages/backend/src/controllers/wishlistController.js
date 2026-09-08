const mongoose = require('mongoose');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { AppError } = require('../middlewares/errorHandler');

const toResponse = (wishlist) => ({
  items: (wishlist?.items || []).filter((item) => item.product && (item.product.status === undefined || item.product.status === 'active')).map((item) => ({ productId: item.product._id || item.product, addedAt: item.addedAt })),
});

const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id }).populate('items.product', '_id status').lean();
    return res.json({ success: true, data: toResponse(wishlist) });
  } catch (error) { return next(error); }
};

const toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!mongoose.isValidObjectId(productId)) return next(new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND'));
    const product = await Product.findOne({ _id: productId, status: 'active' }).select('_id').lean();
    if (!product) return next(new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND'));
    const wishlist = await Wishlist.findOne({ user: req.user._id }) || new Wishlist({ user: req.user._id, items: [] });
    const index = wishlist.items.findIndex((item) => String(item.product) === String(product._id));
    let added;
    if (index >= 0) { wishlist.items.splice(index, 1); added = false; }
    else { wishlist.items.push({ product: product._id, addedAt: new Date() }); added = true; }
    await wishlist.save();
    return res.json({ success: true, data: { ...toResponse({ items: wishlist.items }), productId: product._id, added } });
  } catch (error) { return next(error); }
};

const syncWishlist = async (req, res, next) => {
  try {
    const requested = [...new Set(req.body.productIds || [])].filter((id) => mongoose.isValidObjectId(id));
    const products = requested.length ? await Product.find({ _id: { $in: requested }, status: 'active' }).select('_id').lean() : [];
    const validIds = new Set(products.map((product) => String(product._id)));
    const wishlist = await Wishlist.findOne({ user: req.user._id }) || new Wishlist({ user: req.user._id, items: [] });
    const merged = new Map(wishlist.items.filter((item) => item.product).map((item) => [String(item.product), item.addedAt || new Date()]));
    requested.filter((id) => validIds.has(String(id))).forEach((id) => { if (!merged.has(String(id))) merged.set(String(id), new Date()); });
    wishlist.items = [...merged.entries()].map(([product, addedAt]) => ({ product, addedAt }));
    await wishlist.save();
    return res.json({ success: true, data: toResponse({ items: wishlist.items }) });
  } catch (error) { return next(error); }
};

module.exports = { getWishlist, toggleWishlist, syncWishlist };
