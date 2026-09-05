const express = require('express');
const cookieParser = require('cookie-parser');
const Joi = require('joi');
const validate = require('../middlewares/validate');
const { authMiddleware } = require('../middlewares/authMiddleware');
const Order = require('../models/Order');
const { createOrder } = require('../controllers/orderController');

const router = express.Router();
const orderSchema = Joi.object({ addressId: Joi.string().required(), paymentMethod: Joi.string().valid('bkash', 'nagad').required(), txid: Joi.string().trim().min(4).max(120).required() });
router.use(cookieParser(), authMiddleware);
router.post('/', validate(orderSchema), createOrder);
router.get('/myorders', async (req, res, next) => { try { const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean(); return res.json({ success: true, data: orders }); } catch (error) { return next(error); } });
module.exports = router;
