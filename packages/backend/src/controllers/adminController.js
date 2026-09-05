const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Inventory = require('../models/Inventory');

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'failed', 'returned', 'refunded'];
const PAYMENT_STATUSES = ['pending', 'processing', 'verified', 'failed', 'cancelled', 'refunded'];

const dayStart = (date) => { const value = new Date(date); value.setHours(0, 0, 0, 0); return value; };
const dayKey = (date) => date.toISOString().slice(0, 10);

const getOverview = async (req, res, next) => {
  try {
    const requestedRange = Number(req.query.range);
    const range = requestedRange === 30 ? 30 : 7;
    const now = new Date();
    const today = dayStart(now);
    const periodStart = new Date(today);
    periodStart.setDate(periodStart.getDate() - (range - 1));

    const revenueMatch = { paymentStatus: 'paid' };
    const [
      orderCounts, totalOrderCount, revenue, todayRevenue, periodRevenue, customerCounts, productCounts,
      paymentCounts, recentOrders, lowStock,
    ] = await Promise.all([
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.countDocuments(),
      Order.aggregate([{ $match: revenueMatch }, { $group: { _id: null, amount: { $sum: '$totalAmount' } } }]),
      Order.aggregate([{ $match: { ...revenueMatch, createdAt: { $gte: today } } }, { $group: { _id: null, amount: { $sum: '$totalAmount' } } }]),
      Order.aggregate([{ $match: { ...revenueMatch, createdAt: { $gte: periodStart } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, amount: { $sum: '$totalAmount' }, orders: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Promise.all([User.countDocuments({ role: 'customer' }), User.countDocuments({ role: 'customer', createdAt: { $gte: periodStart } })]),
      Promise.all([Product.countDocuments({ status: { $ne: 'archived' } }), Product.countDocuments({ status: 'active' })]),
      Payment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.aggregate([
        { $sort: { createdAt: -1 } }, { $limit: 8 },
        { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'customer' } },
        { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 1, orderNumber: 1, totalAmount: 1, total: 1, status: 1, paymentStatus: 1, createdAt: 1, customerName: { $trim: { input: { $concat: [{ $ifNull: ['$customer.firstName', ''] }, ' ', { $ifNull: ['$customer.lastName', ''] }] } } }, customerEmail: 1 } },
      ]),
      Inventory.aggregate([
        { $match: { trackInventory: true } }, { $addFields: { availableQuantity: { $max: [0, { $subtract: ['$quantity', '$reservedQuantity'] }] } } },
        { $match: { $expr: { $lte: ['$availableQuantity', '$lowStockThreshold'] } } },
        { $lookup: { from: 'productvariants', localField: 'variant', foreignField: '_id', as: 'variant' } }, { $unwind: '$variant' },
        { $lookup: { from: 'products', localField: 'variant.product', foreignField: '_id', as: 'product' } }, { $unwind: '$product' },
        { $match: { 'product.status': 'active' } }, { $sort: { availableQuantity: 1 } }, { $limit: 10 },
        { $project: { _id: 1, product: '$product.name', sku: '$variant.sku', stock: '$availableQuantity', threshold: '$lowStockThreshold', status: { $cond: [{ $eq: ['$availableQuantity', 0] }, 'out_of_stock', 'low_stock'] } } },
      ]),
    ]);

    const toMap = (rows) => Object.fromEntries(rows.map((row) => [row._id, row.count]));
    const orderMap = toMap(orderCounts); const paymentMap = toMap(paymentCounts);
    const trendMap = Object.fromEntries(periodRevenue.map((row) => [row._id, { amount: row.amount, orders: row.orders }]));
    const trend = Array.from({ length: range }, (_, index) => { const date = new Date(periodStart); date.setDate(periodStart.getDate() + index); const key = dayKey(date); return { date: key, amount: trendMap[key]?.amount || 0, orders: trendMap[key]?.orders || 0 }; });
    return res.json({ success: true, data: {
      range, orders: { total: totalOrderCount, byStatus: Object.fromEntries(ORDER_STATUSES.map((status) => [status, orderMap[status] || 0])) },
      revenue: { total: revenue[0]?.amount || 0, today: todayRevenue[0]?.amount || 0, period: periodRevenue.reduce((sum, item) => sum + item.amount, 0), trend },
      customers: { total: customerCounts[0], newInPeriod: customerCounts[1] },
      products: { total: productCounts[0], active: productCounts[1], lowStock: lowStock.filter((item) => item.status === 'low_stock').length, outOfStock: lowStock.filter((item) => item.status === 'out_of_stock').length },
      payments: { byStatus: Object.fromEntries(PAYMENT_STATUSES.map((status) => [status, paymentMap[status] || 0])) },
      recentOrders: recentOrders.map((order) => ({ ...order, customerName: order.customerName || order.customerEmail || 'Guest customer', amount: order.totalAmount ?? order.total })),
      lowStock,
    } });
  } catch (error) { return next(error); }
};

module.exports = { getOverview };
