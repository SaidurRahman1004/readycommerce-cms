require('./config/env');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');
const authRoutes = require('./routes/authRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const cartRoutes = require('./routes/cartRoutes');
const addressRoutes = require('./routes/addressRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const couponRoutes = require('./routes/couponRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const adminRoutes = require('./routes/adminRoutes');
const adminNotificationRoutes = require('./routes/adminNotificationRoutes');
const adminMediaRoutes = require('./routes/adminMediaRoutes');
const leadRoutes = require('./routes/leadRoutes');
const path = require('path');
const { getShippingCost } = require('./utils/shipping');
const StoreSettings = require('./models/StoreSettings');

const app = express();

app.use(helmet());
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000,http://localhost:3001').split(',').map((origin) => origin.trim());
app.use(cors({ origin: (origin, callback) => {
  if (!origin || process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
    return callback(null, true);
  }
  return callback(new Error('Origin not allowed'));
}, credentials: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'ReadyCommerce API Engine is running' });
});
app.use('/api/auth', authRoutes);
app.use('/api', catalogRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/leads', leadRoutes);
app.get('/api/cms/homepage', async (req,res,next) => { try { const HomepageConfig=require('./models/HomepageConfig'); const data=await HomepageConfig.findOne({key:'homepage'}).populate('featuredCategories','name slug image').lean(); return res.json({success:true,data:data||{slides:[],featuredCategories:[],promoEnabled:false}}); } catch(e) { return next(e); } });
app.use('/api/admin', adminRoutes);
app.use('/api/admin/notifications', adminNotificationRoutes);
app.use('/api/admin/media', adminMediaRoutes);
app.use('/uploads', express.static(path.resolve(__dirname, '../public/uploads'), { index: false, maxAge: '1d' }));
app.get('/api/shipping/quote', async (req, res, next) => {
  try {
    const city = typeof req.query.city === 'string' ? req.query.city : '';
    res.json({ success: true, data: { city, cost: await getShippingCost(city), currency: 'BDT' } });
  } catch (e) {
    next(e);
  }
});
app.get('/api/settings/shipping', async (req, res, next) => { try { const settings = await StoreSettings.findOne({ key: 'store' }).select('insideDhakaRate outsideDhakaRate currency').lean(); const city = typeof req.query.city === 'string' ? req.query.city : ''; const dhaka = city.trim().toLowerCase() === 'dhaka'; res.json({ success: true, data: { city, insideDhakaRate: settings?.insideDhakaRate ?? 60, outsideDhakaRate: settings?.outsideDhakaRate ?? 120, cost: dhaka ? (settings?.insideDhakaRate ?? 60) : (settings?.outsideDhakaRate ?? 120), currency: settings?.currency || 'BDT' } }); } catch (e) { next(e); } });

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    const logger = require('./utils/logger');
    app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
  } catch (error) {
    const logger = require('./utils/logger');
    logger.error(`Unable to start server: ${error.message}`);
    process.exitCode = 1;
  }
};

app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) startServer();

module.exports = { app, startServer };
