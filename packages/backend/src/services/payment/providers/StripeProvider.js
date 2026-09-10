const Stripe = require('stripe');
const PaymentProvider = require('../PaymentProvider');

class StripeProvider extends PaymentProvider {
  constructor() {
    super('stripe');
  }

  _getStripeInstance(paymentSetting) {
    const creds = paymentSetting.getDecryptedCredentials() || {};
    const secretKey = paymentSetting.mode === 'live' ? creds.liveSecretKey : creds.testSecretKey;
    if (!secretKey) throw new Error(`Stripe ${paymentSetting.mode} secret key not configured`);
    
    return {
      stripe: new Stripe(secretKey, { apiVersion: '2024-06-20' }),
      webhookSecret: paymentSetting.mode === 'live' ? creds.liveWebhookSecret : creds.testWebhookSecret
    };
  }

  async initializePayment(order, paymentSetting, user) {
    console.log(`[Stripe] Initializing payment for order: ${order._id}`);
    try {
      const { stripe } = this._getStripeInstance(paymentSetting);
      const baseUrl = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000').split(',')[0].trim();
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: order.email || user?.email,
        client_reference_id: order._id.toString(),
        metadata: {
          orderId: order._id.toString(),
          tenantId: paymentSetting.tenantId ? paymentSetting.tenantId.toString() : ''
        },
        line_items: [
          {
            price_data: {
              currency: 'bdt',
              product_data: {
                name: `Order ${order.orderNumber}`
              },
              unit_amount: Math.round(order.totalAmount * 100),
            },
            quantity: 1,
          }
        ],
        success_url: `${baseUrl}/success?orderId=${order._id}`,
        cancel_url: `${baseUrl}/checkout`,
      });

      return {
        success: true,
        provider: this.providerName,
        redirectUrl: session.url,
        transactionId: session.id,
      };
    } catch (error) {
      console.error('[Stripe Init Error]:', error.message);
      return { success: false, error: error.message };
    }
  }

  async verifyPayment(verificationData, paymentSetting) {
    return { success: true };
  }

  async handleWebhook(req, paymentSetting) {
    const { stripe, webhookSecret } = this._getStripeInstance(paymentSetting);
    
    const signature = req.headers['stripe-signature'];
    if (!signature) {
       throw new Error('No Stripe signature found in headers');
    }

    if (!webhookSecret) {
       throw new Error(`Stripe ${paymentSetting.mode} webhook secret not configured`);
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, signature, webhookSecret);
    } catch (err) {
      console.error(`[Stripe Webhook Error] Signature verification failed: ${err.message}`);
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    let internalStatus = 'pending';
    let orderId;
    let amount;
    let currency;
    let transactionId;
    if (event.type === 'checkout.session.completed') {
      internalStatus = 'paid';
      
      const session = event.data.object;
      orderId = session.metadata?.orderId || session.client_reference_id;
      amount = session.amount_total;
      currency = session.currency;
      transactionId = session.payment_intent || session.id;
      if (session.payment_status !== 'paid') internalStatus = 'failed';
    } else if (event.type === 'checkout.session.expired') {
      internalStatus = 'failed';
      const session = event.data.object;
      orderId = session.metadata?.orderId || session.client_reference_id;
      amount = session.amount_total;
      currency = session.currency;
      transactionId = session.payment_intent || session.id;
    }

    return {
      eventId: event.id,
      status: internalStatus,
      payload: event,
      orderId,
      amount,
      amountIsMinor: true,
      currency,
      transactionId,
    };
  }

  async refundPayment(payment, amount, paymentSetting) {
    const { stripe } = this._getStripeInstance(paymentSetting);
    const refund = await stripe.refunds.create({
      payment_intent: payment.transactionId,
      amount: Math.round(amount * 100)
    });
    return { success: true, refundId: refund.id };
  }
}

module.exports = StripeProvider;
