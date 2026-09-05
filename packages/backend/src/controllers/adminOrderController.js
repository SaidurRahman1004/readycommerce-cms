const mongoose = require('mongoose');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { AppError } = require('../middlewares/errorHandler');

const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'failed', 'returned', 'refunded'];
const transitions = { pending: ['confirmed', 'processing', 'cancelled', 'failed'], confirmed: ['processing', 'cancelled'], processing: ['shipped', 'cancelled'], shipped: ['delivered'], delivered: [], cancelled: [], failed: [], returned: ['refunded'], refunded: [] };
const paymentStatuses = ['pending', 'processing', 'verified', 'failed', 'cancelled', 'refunded'];
const safeCustomer = (user, email) => ({ name: user ? `${user.firstName} ${user.lastName}`.trim() : 'Guest customer', email: user?.email || email });

const listOrders = async (req, res, next) => { try {
  const page = Math.max(1, Number(req.query.page) || 1); const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const filter = {}; if (statuses.includes(req.query.status)) filter.status = req.query.status; if (paymentStatuses.includes(req.query.paymentStatus)) filter.paymentStatus = req.query.paymentStatus;
  if (typeof req.query.search === 'string' && req.query.search.trim()) { const search = req.query.search.trim(); filter.$or = [{ orderNumber: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }]; }
  const [orders, total] = await Promise.all([Order.find(filter).populate('user', 'firstName lastName email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Order.countDocuments(filter)]);
  return res.json({ success: true, data: orders.map((order) => ({ _id: order._id, orderNumber: order.orderNumber, customer: safeCustomer(order.user, order.email), amount: order.totalAmount ?? order.total, status: order.status, paymentStatus: order.paymentStatus, createdAt: order.createdAt })), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
} catch (error) { return next(error); } };

const getOrder = async (req, res, next) => { try {
  if (!mongoose.isValidObjectId(req.params.id)) return next(new AppError('Order not found.', 404, 'ORDER_NOT_FOUND'));
  const order = await Order.findById(req.params.id).populate('user', 'firstName lastName email phone').lean(); if (!order) return next(new AppError('Order not found.', 404, 'ORDER_NOT_FOUND'));
  const [items, payments] = await Promise.all([OrderItem.find({ order: order._id }).populate('variant', 'name size color scent sku').lean(), Payment.find({ order: order._id }).select('provider method amount currency transactionId status verifiedBy verifiedAt failureReason createdAt').populate('verifiedBy', 'firstName lastName').sort({ createdAt: -1 }).lean()]);
  return res.json({ success: true, data: { _id: order._id, orderNumber: order.orderNumber, customer: safeCustomer(order.user, order.email), shippingAddress: order.shippingAddress, billingAddress: order.billingAddress, subtotal: order.subtotal, discount: order.discount, shipping: order.shipping, tax: order.tax, total: order.totalAmount ?? order.total, currency: order.currency, status: order.status, paymentStatus: order.paymentStatus, shippingMethod: order.shippingMethod, trackingNumber: order.trackingNumber, carrier: order.carrier, createdAt: order.createdAt, placedAt: order.placedAt, items: items.map((item) => ({ productName: item.productName, sku: item.sku, quantity: item.quantity, unitPrice: item.unitPrice, discount: item.discount, total: item.total, variant: item.variant })), payments } });
} catch (error) { return next(error); } };

const updateStatus = async (req, res, next) => { try { const { status } = req.body; if (!statuses.includes(status)) return next(new AppError('Invalid order status.', 400, 'INVALID_STATUS')); const order = await Order.findById(req.params.id); if (!order) return next(new AppError('Order not found.', 404, 'ORDER_NOT_FOUND')); if (order.status !== status && !transitions[order.status]?.includes(status)) return next(new AppError(`Order cannot move from ${order.status} to ${status}.`, 409, 'INVALID_STATUS_TRANSITION')); order.status = status; if (status === 'delivered') order.deliveredAt = new Date(); if (status === 'cancelled') order.cancelledAt = new Date(); await order.save(); return res.json({ success: true, data: { orderId: order._id, status: order.status } }); } catch (error) { return next(error); } };

const updatePayment = async (req, res, next) => { try { const { status, failureReason } = req.body; if (!paymentStatuses.includes(status)) return next(new AppError('Invalid payment status.', 400, 'INVALID_PAYMENT_STATUS')); const order = await Order.findById(req.params.id); if (!order) return next(new AppError('Order not found.', 404, 'ORDER_NOT_FOUND')); const payment = await Payment.findOne({ order: order._id }).sort({ createdAt: -1 }); if (!payment) return next(new AppError('Payment record not found.', 404, 'PAYMENT_NOT_FOUND')); payment.status = status; payment.failureReason = status === 'failed' ? String(failureReason || 'Payment rejected by administrator.').slice(0, 500) : undefined; if (status === 'verified') { payment.verifiedBy = req.user._id; payment.verifiedAt = new Date(); order.paymentStatus = 'paid'; order.paidAt = new Date(); } else if (status === 'failed') order.paymentStatus = 'failed'; else if (status === 'refunded') order.paymentStatus = 'refunded'; else order.paymentStatus = 'pending'; await payment.save(); await order.save(); return res.json({ success: true, data: { orderId: order._id, paymentStatus: order.paymentStatus, payment } }); } catch (error) { return next(error); } };
module.exports = { listOrders, getOrder, updateStatus, updatePayment };
