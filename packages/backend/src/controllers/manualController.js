const mongoose = require('mongoose');
const Joi = require('joi');
const Manual = require('../models/Manual');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const { AppError } = require('../middlewares/errorHandler');

const slugify = (value) => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'manual';
const schema = Joi.object({
  title: Joi.string().trim().min(3).max(180).required(),
  slug: Joi.string().trim().lowercase().max(140).pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).allow(''),
  type: Joi.string().valid('staff_sop', 'customer_guide').required(),
  content: Joi.string().trim().min(1).max(100000).required(),
  relatedProducts: Joi.array().items(Joi.string()).default([]),
  status: Joi.string().valid('active', 'draft').default('draft'),
});

const validateIdList = (ids) => ids.every((id) => mongoose.isValidObjectId(id));
const getValue = (body) => {
  const { error, value } = schema.validate(body, { abortEarly: false, stripUnknown: true });
  if (error) throw new AppError(error.details.map((item) => item.message).join('; '), 400, 'VALIDATION_ERROR');
  if (!validateIdList(value.relatedProducts)) throw new AppError('One or more related products are invalid.', 400, 'INVALID_PRODUCT_ID');
  value.slug = slugify(value.slug || value.title);
  return value;
};

const list = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.type && ['staff_sop', 'customer_guide'].includes(req.query.type)) filter.type = req.query.type;
    if (req.query.status && ['active', 'draft'].includes(req.query.status)) filter.status = req.query.status;
    const data = await Manual.find(filter).populate('relatedProducts', 'name slug images').sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data });
  } catch (error) { return next(error); }
};

const create = async (req, res, next) => {
  try {
    const value = getValue(req.body);
    if (await Manual.exists({ slug: value.slug })) return next(new AppError('A manual with this slug already exists.', 409, 'SLUG_EXISTS'));
    const data = await Manual.create({ ...value, createdBy: req.user._id, updatedBy: req.user._id });
    return res.status(201).json({ success: true, data });
  } catch (error) { return next(error); }
};

const update = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return next(new AppError('Invalid manual ID.', 400, 'INVALID_ID'));
    const value = getValue(req.body);
    if (await Manual.exists({ slug: value.slug, _id: { $ne: req.params.id } })) return next(new AppError('A manual with this slug already exists.', 409, 'SLUG_EXISTS'));
    const data = await Manual.findByIdAndUpdate(req.params.id, { ...value, updatedBy: req.user._id }, { new: true, runValidators: true }).populate('relatedProducts', 'name slug images').lean();
    if (!data) return next(new AppError('Manual not found.', 404, 'MANUAL_NOT_FOUND'));
    return res.json({ success: true, data });
  } catch (error) { return next(error); }
};

const remove = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return next(new AppError('Invalid manual ID.', 400, 'INVALID_ID'));
    const data = await Manual.findByIdAndDelete(req.params.id);
    if (!data) return next(new AppError('Manual not found.', 404, 'MANUAL_NOT_FOUND'));
    return res.json({ success: true, message: 'Manual deleted.' });
  } catch (error) { return next(error); }
};

const customerGuides = async (req, res, next) => {
  try {
    let productIds = [];
    if (req.user) {
      const orderIds = await Order.find({ user: req.user._id, status: { $nin: ['cancelled', 'failed'] } }).distinct('_id');
      productIds = await OrderItem.find({ order: { $in: orderIds }, product: { $ne: null } }).distinct('product');
    }
    const data = await Manual.find({ type: 'customer_guide', status: 'active', $or: [{ relatedProducts: { $size: 0 } }, { relatedProducts: { $in: productIds } }] })
      .populate('relatedProducts', 'name slug images').sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data });
  } catch (error) { return next(error); }
};

module.exports = { list, create, update, remove, customerGuides };
