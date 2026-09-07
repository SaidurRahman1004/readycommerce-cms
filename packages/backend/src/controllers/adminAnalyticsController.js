const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const User = require('../models/User');
const { AppError } = require('../middlewares/errorHandler');

const getAnalytics = async (req, res, next) => {
  try {
    const requested = String(req.query.range || '30').toLowerCase();
    if (!['7', '30', 'all'].includes(requested)) return next(new AppError('Invalid analytics range.', 400, 'INVALID_RANGE'));
    const now = new Date();
    const start = requested === 'all' ? null : new Date(now.getTime() - (Number(requested) - 1) * 86400000);
    if (start) start.setHours(0, 0, 0, 0);
    const orderMatch = { paymentStatus: 'paid', ...(start ? { createdAt: { $gte: start } } : {}) };
    const customerMatch = { role: 'customer', ...(start ? { createdAt: { $gte: start } } : {}) };
    const [trend, topProducts, categories, customerGrowth] = await Promise.all([
      Order.aggregate([
        { $match: orderMatch },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: orderMatch }, { $lookup: { from: 'orderitems', localField: '_id', foreignField: 'order', as: 'items' } }, { $unwind: '$items' },
        { $group: { _id: '$items.product', product: { $first: '$items.productName' }, quantity: { $sum: '$items.quantity' }, revenue: { $sum: '$items.total' } } },
        { $sort: { quantity: -1, revenue: -1 } }, { $limit: 10 }, { $project: { _id: 1, product: 1, quantity: 1, revenue: 1 } },
      ]),
      Order.aggregate([
        { $match: orderMatch }, { $lookup: { from: 'orderitems', localField: '_id', foreignField: 'order', as: 'items' } }, { $unwind: '$items' },
        { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'product' } }, { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'categories', localField: 'product.category', foreignField: '_id', as: 'category' } }, { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$category._id', category: { $first: { $ifNull: ['$category.name', 'Uncategorized'] } }, quantity: { $sum: '$items.quantity' }, revenue: { $sum: '$items.total' } } },
        { $sort: { revenue: -1 } }, { $project: { _id: 1, category: 1, quantity: 1, revenue: 1 } },
      ]),
      User.aggregate([{ $match: customerMatch }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, customers: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    ]);
    const totalRevenue = trend.reduce((sum, row) => sum + row.revenue, 0);
    const totalOrders = trend.reduce((sum, row) => sum + row.orders, 0);
    return res.json({ success: true, data: { range: requested, summary: { revenue: totalRevenue, orders: totalOrders, customers: await User.countDocuments(customerMatch) }, trend: trend.map((row) => ({ date: row._id, revenue: row.revenue, orders: row.orders })), topProducts, categories, customerGrowth: customerGrowth.map((row) => ({ date: row._id, customers: row.customers })) } });
  } catch (error) { return next(error); }
};

const exportAnalytics = async (req, res, next) => {
  try {
    const { Parser } = require('json2csv');
    const requested = String(req.query.range || '30').toLowerCase();
    if (!['7', '30', 'all'].includes(requested)) return next(new AppError('Invalid analytics range.', 400, 'INVALID_RANGE'));
    const now = new Date();
    const start = requested === 'all' ? null : new Date(now.getTime() - (Number(requested) - 1) * 86400000);
    if (start) start.setHours(0, 0, 0, 0);
    
    // We will export the "trend" data (Daily Revenue & Orders) as it's the most standard analytics export.
    const orderMatch = { paymentStatus: 'paid', ...(start ? { createdAt: { $gte: start } } : {}) };
    const trend = await Order.aggregate([
      { $match: orderMatch },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    
    const data = trend.map((row) => ({ Date: row._id, Revenue: row.revenue, Orders: row.orders }));
    const parser = new Parser({ fields: ['Date', 'Revenue', 'Orders'] });
    const csv = parser.parse(data);
    res.header('Content-Type', 'text/csv');
    res.attachment(`analytics-trend-export-${new Date().toISOString().slice(0,10)}.csv`);
    return res.send(csv);
  } catch (error) { return next(error); }
};

module.exports = { getAnalytics, exportAnalytics };
