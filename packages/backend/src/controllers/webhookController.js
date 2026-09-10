const mongoose = require('mongoose');
const PaymentProviderFactory = require('../services/payment/PaymentProviderFactory');
const WebhookEvent = require('../models/WebhookEvent');
const PaymentSetting = require('../models/PaymentSetting');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const logger = require('../utils/logger');

const MONEY_TOLERANCE = 0.01;
const storefrontOrigin = () => (process.env.FRONTEND_ORIGIN || 'http://localhost:3000').split(',')[0].trim();

const toMajorAmount = (amount, amountIsMinor = false) => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return null;
  return amountIsMinor ? numericAmount / 100 : numericAmount;
};

const sameCurrency = (left, right) => {
  if (!left || !right) return false;
  return String(left).toUpperCase() === String(right).toUpperCase();
};

const recordFailedEvent = async (eventRecord, reason) => {
  eventRecord.status = 'failed';
  eventRecord.error = reason;
  await eventRecord.save();
};

/**
 * Settles a verified provider event in one MongoDB transaction. Providers only
 * parse/verify callbacks; this is the single database settlement boundary.
 */
const settlePayment = async (provider, parsedEvent) => {
  if (!parsedEvent.orderId || !mongoose.isValidObjectId(parsedEvent.orderId)) {
    throw new Error('Webhook did not contain a valid order reference.');
  }

  const session = await mongoose.startSession();
  try {
    let result = { duplicate: false, amountMismatch: false };
    await session.withTransaction(async () => {
      const order = await Order.findById(parsedEvent.orderId).session(session);
      if (!order) throw new Error('Webhook order was not found.');

      // A later callback must never move an already-settled order backwards.
      if (order.paymentStatus === 'paid' || ['processing', 'shipped', 'delivered'].includes(order.status)) {
        result.duplicate = true;
        return;
      }

      const payment = await Payment.findOne({ order: order._id, provider }).sort({ createdAt: -1 }).session(session);
      if (!payment) throw new Error('Webhook payment record was not found.');

      if (parsedEvent.status === 'paid') {
        const providerAmount = toMajorAmount(parsedEvent.amount, parsedEvent.amountIsMinor);
        const expectedAmount = Number(order.totalAmount ?? order.total);
        const providerCurrency = parsedEvent.currency || payment.currency;
        const expectedCurrency = order.currency || payment.currency || 'BDT';

        if (providerAmount === null || !sameCurrency(providerCurrency, expectedCurrency) || Math.abs(providerAmount - expectedAmount) > MONEY_TOLERANCE) {
          result.amountMismatch = true;
          payment.status = 'failed';
          payment.failureReason = 'Provider amount or currency did not match the order.';
          payment.providerResponse = parsedEvent.payload;
          await payment.save({ session });
          logger.error('SECURITY ALERT: payment webhook amount mismatch', {
            provider,
            orderId: String(order._id),
            expectedAmount,
            providerAmount,
            expectedCurrency,
            providerCurrency,
            eventId: parsedEvent.eventId,
          });
          return;
        }

        payment.status = 'paid';
        payment.transactionId = parsedEvent.transactionId || payment.transactionId;
        payment.currency = expectedCurrency;
        payment.paidAt = new Date();
        payment.providerResponse = parsedEvent.payload;
        await payment.save({ session });

        order.paymentStatus = 'paid';
        order.paidAt = new Date();
        if (['pending', 'confirmed'].includes(order.status)) order.status = 'processing';
        await order.save({ session });
        return;
      }

      if (parsedEvent.status === 'failed') {
        payment.status = 'failed';
        payment.failureReason = 'Payment provider reported a failed or cancelled payment.';
        payment.transactionId = parsedEvent.transactionId || payment.transactionId;
        payment.providerResponse = parsedEvent.payload;
        await payment.save({ session });
        order.paymentStatus = 'failed';
        await order.save({ session });
      }
    });
    return result;
  } finally {
    await session.endSession();
  }
};

/**
 * @desc    Handle incoming payment webhooks
 * @route   POST /api/webhooks/payment/:provider
 * @access  Public (provider signature/verification is mandatory)
 */
exports.handleWebhook = async (req, res) => {
  const { provider } = req.params;
  const tenantId = req.query.tenantId || null;

  try {
    const paymentProvider = PaymentProviderFactory.getProvider(provider);
    const paymentSetting = await PaymentSetting.findOne({ tenantId, provider });
    if (!paymentSetting || !paymentSetting.enabled) {
      console.warn(`[Webhook] Received webhook for disabled or unknown provider: ${provider}`);
      return res.status(400).send('Provider not configured');
    }

    const parsedEvent = await paymentProvider.handleWebhook(req, paymentSetting);

    // Redirect-only callbacks without an order/event cannot mutate payment state.
    if (!parsedEvent || !parsedEvent.eventId) {
      if (parsedEvent?.isRedirect) return res.redirect(parsedEvent.url);
      return res.status(400).send('Invalid webhook event');
    }

    let eventRecord = await WebhookEvent.findOne({ provider, eventId: parsedEvent.eventId });
    if (eventRecord?.status === 'processed') {
      if (parsedEvent.isRedirect) return res.redirect(parsedEvent.url);
      return res.status(200).send('Already processed');
    }

    if (!eventRecord) {
      try {
        eventRecord = await WebhookEvent.create({
          provider,
          eventId: parsedEvent.eventId,
          status: 'pending',
          payload: parsedEvent.payload,
        });
      } catch (error) {
        if (error?.code !== 11000) throw error;
        eventRecord = await WebhookEvent.findOne({ provider, eventId: parsedEvent.eventId });
        if (eventRecord?.status === 'processed') {
          if (parsedEvent.isRedirect) return res.redirect(parsedEvent.url);
          return res.status(200).send('Already processed');
        }
      }
    }

    const settlement = await settlePayment(provider, parsedEvent);
    if (settlement.amountMismatch) {
      await recordFailedEvent(eventRecord, 'Provider amount or currency did not match the order.');
      if (parsedEvent.isRedirect) return res.redirect(`${storefrontOrigin()}/checkout?error=amount_mismatch`);
      return res.status(200).send('Webhook rejected');
    }

    eventRecord.status = 'processed';
    eventRecord.error = undefined;
    await eventRecord.save();

    if (parsedEvent.isRedirect) return res.redirect(parsedEvent.url);
    return res.status(200).send(settlement.duplicate ? 'Already settled' : 'Webhook handled');
  } catch (error) {
    logger.error(`[Webhook Error - ${provider}]`, { error: error.message });
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
};
