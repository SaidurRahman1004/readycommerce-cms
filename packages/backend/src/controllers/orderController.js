const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const ProductVariant = require('../models/ProductVariant');
const Inventory = require('../models/Inventory');
const Address = require('../models/Address');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Payment = require('../models/Payment');
const Coupon = require('../models/Coupon');
const { AppError } = require('../middlewares/errorHandler');
const { getShippingCost } = require('../utils/shipping');
const { createNotification } = require('../utils/notifications');
const { sendOrderConfirmation } = require('../utils/mailer');
const PaymentProviderFactory = require('../services/payment/PaymentProviderFactory');
const PaymentSetting = require('../models/PaymentSetting');

const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return next(new AppError('Order not found.', 404, 'ORDER_NOT_FOUND'));
    if (order.status !== 'pending') return next(new AppError('Only pending orders can be cancelled.', 409, 'ORDER_NOT_CANCELLABLE'));
    order.status = 'cancelled'; order.cancelledAt = new Date(); await order.save();
    return res.json({ success: true, data: { orderId: order._id, status: order.status } });
  } catch (error) { return next(error); }
};
const getMyOrder = async (req, res, next) => { try { const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).lean(); if (!order) return next(new AppError('Order not found.', 404, 'ORDER_NOT_FOUND')); const items = await OrderItem.find({ order: order._id }).lean(); return res.json({ success: true, data: { ...order, items } }); } catch (error) { return next(error); } };

const createOrder = async (req, res, next) => {
  try {
    const { addressId, paymentMethod, txid, couponCode } = req.body;
    const idempotencyKey = req.headers['x-idempotency-key'] || req.body.idempotencyKey;
    
    if (idempotencyKey) {
      const existingOrder = await Order.findOne({ idempotencyKey, user: req.user._id }).lean();
      if (existingOrder) {
        return res.status(200).json({ success: true, data: { orderId: existingOrder._id, orderNumber: existingOrder.orderNumber, total: existingOrder.total, status: existingOrder.status, isDuplicate: true } });
      }
    }

    if (!mongoose.isValidObjectId(addressId)) return next(new AppError('A valid shipping address is required.', 400, 'INVALID_ADDRESS'));

    const address = await Address.findOne({ _id: addressId, user: req.user._id, type: 'shipping' }).lean();
    if (!address) return next(new AppError('Shipping address not found.', 404, 'ADDRESS_NOT_FOUND'));
    const isManual = ['bkash', 'nagad'].includes(paymentMethod);
    if (!['bkash', 'nagad', 'stripe'].includes(paymentMethod)) return next(new AppError('A valid payment method is required.', 400, 'INVALID_PAYMENT'));
    if (isManual) {
      if (typeof txid !== 'string' || txid.trim().length < 4) return next(new AppError('A transaction ID is required for manual payments.', 400, 'INVALID_PAYMENT'));
      if (await Payment.exists({ transactionId: txid.trim() })) return next(new AppError('This transaction ID has already been submitted.', 409, 'DUPLICATE_TRANSACTION'));
    }

    let paymentSetting = null;
    let paymentProvider = null;
    if (!isManual) {
      paymentSetting = await PaymentSetting.findOne({ provider: paymentMethod, enabled: true });
      if (!paymentSetting) return next(new AppError('This payment method is currently disabled or unconfigured.', 400, 'PAYMENT_DISABLED'));
      paymentProvider = PaymentProviderFactory.getProvider(paymentMethod);
    }

    const cart = await Cart.findOne({ user: req.user._id, status: 'active' });
    if (!cart) return next(new AppError('Your cart is empty.', 400, 'EMPTY_CART'));
    const cartItems = await CartItem.find({ cart: cart._id }).lean();
    if (!cartItems.length) return next(new AppError('Your cart is empty.', 400, 'EMPTY_CART'));

    const verifiedItems = [];
    let subtotal = 0;
    for (const item of cartItems) {
      const variant = await ProductVariant.findOne({ _id: item.variant, product: item.product, isActive: true }).lean();
      if (!variant) return next(new AppError('A product in your cart is no longer available.', 409, 'CART_REVALIDATION_FAILED'));
      const inventory = await Inventory.findOne({ variant: variant._id }).lean();
      const available = inventory?.trackInventory === false ? Number.MAX_SAFE_INTEGER : Math.max(0, (inventory?.quantity || 0) - (inventory?.reservedQuantity || 0));
      if (item.quantity > available) return next(new AppError(`${item.productName} has insufficient stock.`, 409, 'INSUFFICIENT_STOCK'));
      const total = variant.price * item.quantity;
      subtotal += total;
      verifiedItems.push({ ...item, unitPrice: variant.price, total, sku: variant.sku, productName: item.productName });
    }

    let discount = 0;
    if (couponCode) { const coupon = await Coupon.findOne({ code: String(couponCode).trim().toUpperCase(), isActive: true, startsAt: { $lte: new Date() }, expiresAt: { $gt: new Date() } }).lean(); if (!coupon || subtotal < coupon.minOrderAmount) return next(new AppError('Coupon is invalid or no longer applicable.', 400, 'INVALID_COUPON')); discount = coupon.discountType === 'percent' ? subtotal * coupon.discountValue / 100 : coupon.discountValue; if (coupon.maxDiscountAmount) discount = Math.min(discount, coupon.maxDiscountAmount); discount = Math.min(subtotal, discount); }
    const shipping = await getShippingCost(address.city);
    const total = subtotal - discount + shipping;
    const orderNumber = `RC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const order = await Order.create({ orderNumber, user: req.user._id, email: req.user.email, status: 'pending', paymentStatus: 'pending', subtotal, discount, shipping, total, totalAmount: total, shippingAddress: address, shippingMethod: 'standard', idempotencyKey });
    await OrderItem.insertMany(verifiedItems.map((item) => ({ order: order._id, product: item.product, variant: item.variant, productName: item.productName, sku: item.sku, quantity: item.quantity, unitPrice: item.unitPrice, total: item.total })));
    const payment = await Payment.create({ order: order._id, user: req.user._id, provider: paymentMethod, method: paymentMethod, amount: total, transactionId: isManual ? txid.trim() : `temp_${order._id}`, status: 'pending' });
    
    let redirectUrl = null;
    if (!isManual && paymentProvider && paymentSetting) {
      try {
        const initResult = await paymentProvider.initializePayment(order, paymentSetting, req.user);
        if (initResult.success && initResult.redirectUrl) {
           redirectUrl = initResult.redirectUrl;
           if (initResult.transactionId) {
             payment.transactionId = initResult.transactionId;
             await payment.save();
           }
        } else {
           throw new Error(initResult.error || 'Failed to initialize payment');
        }
      } catch (err) {
        console.error('[Payment Init Error]:', err);
        return next(new AppError('Payment initialization failed. Please try again.', 500, 'PAYMENT_INIT_FAILED'));
      }
    }
    
    await CartItem.deleteMany({ cart: cart._id });
    cart.status = 'converted'; cart.subtotal = 0; cart.shipping = 0; cart.tax = 0; cart.total = 0; await cart.save();
    void createNotification({ type: 'order', title: 'New order received', message: `${order.orderNumber} is waiting for review.`, targetUrl: `/orders/${order._id}` }).catch(() => {});
    void sendOrderConfirmation({ to: order.email, order: order.toObject(), items: verifiedItems }).catch((error) => console.error('[mailer] Order confirmation failed:', error.message));
    return res.status(201).json({ success: true, data: { orderId: order._id, orderNumber: order.orderNumber, total: order.total, status: order.status, paymentUrl: redirectUrl } });
  } catch (error) {
    if (error?.code === 11000) return next(new AppError('This transaction ID or request has already been submitted.', 409, 'DUPLICATE_TRANSACTION'));
    return next(error);
  }
};

module.exports = { createOrder, cancelOrder, getMyOrder };
