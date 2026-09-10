const express = require('express');
const cookieParser = require('cookie-parser');
const Joi = require('joi');
const validate = require('../middlewares/validate');
const { authMiddleware } = require('../middlewares/authMiddleware');
const Order = require('../models/Order');
const { createOrder, cancelOrder, getMyOrder } = require('../controllers/orderController');

const Payment = require('../models/Payment');
const router = express.Router();
const orderSchema = Joi.object({ 
  addressId: Joi.string().required(), 
  paymentMethod: Joi.string().required(), 
  txid: Joi.string().trim().allow('', null), 
  senderNumber: Joi.string().trim().allow('', null),
  reference: Joi.string().trim().allow('', null),
  couponCode: Joi.string().trim().max(40).allow('') 
});
router.use(cookieParser(), authMiddleware);
router.post('/', validate(orderSchema), createOrder);
router.put('/:id/cancel', cancelOrder);
router.get('/myorders', async (req, res, next) => { 
  try { 
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean(); 
    const orderIds = orders.map(o => o._id);
    const payments = await Payment.find({ order: { $in: orderIds } }).lean();
    
    const enrichedOrders = orders.map(o => {
      const p = payments.find(pay => String(pay.order) === String(o._id));
      return { ...o, manualPayment: p && p.provider === 'manual' ? { status: p.status, failureReason: p.failureReason } : null };
    });
    
    return res.json({ success: true, data: enrichedOrders }); 
  } catch (error) { 
    return next(error); 
  } 
});
router.get('/:id', getMyOrder);
module.exports = router;
