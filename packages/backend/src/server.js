const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
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
const adminRoutes = require('./routes/adminRoutes');
const { getShippingCost } = require('./utils/shipping');

dotenv.config();

const app = express();

app.use(helmet());
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000').split(',').map((origin) => origin.trim());
app.use(cors({ origin: (origin, callback) => (!origin || allowedOrigins.includes(origin) ? callback(null, true) : callback(new Error('Origin not allowed'))), credentials: true }));
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
app.use('/api/admin', adminRoutes);
app.get('/api/shipping/quote', (req, res) => {
  const city = typeof req.query.city === 'string' ? req.query.city : '';
  res.json({ success: true, data: { city, cost: getShippingCost(city), currency: 'BDT' } });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error(`Unable to start server: ${error.message}`);
    process.exitCode = 1;
  }
};

app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) startServer();

module.exports = { app, startServer };
