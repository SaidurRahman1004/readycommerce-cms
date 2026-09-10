const SSLCommerzPayment = require('sslcommerz-lts');
const PaymentProvider = require('../PaymentProvider');

class SSLCommerzProvider extends PaymentProvider {
  constructor() {
    super('sslcommerz');
  }

  _getSSLCommerzInstance(paymentSetting) {
    const creds = paymentSetting.getDecryptedCredentials() || {};
    const storeId = paymentSetting.mode === 'live' ? creds.liveStoreId : creds.testStoreId;
    const storePassword = paymentSetting.mode === 'live' ? creds.liveStorePassword : creds.testStorePassword;
    
    if (!storeId || !storePassword) {
      throw new Error(`SSLCommerz ${paymentSetting.mode} credentials not fully configured`);
    }

    const isLive = paymentSetting.mode === 'live';
    return new SSLCommerzPayment(storeId, storePassword, isLive);
  }

  async initializePayment(order, paymentSetting, user) {
    console.log(`[SSLCommerz] Initializing payment for order: ${order._id}`);
    try {
      const sslcz = this._getSSLCommerzInstance(paymentSetting);
      const baseUrl = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000').split(',')[0].trim();
      const backendUrl = process.env.API_URL || 'http://localhost:5000/api';

      const transactionId = `SSLCZ_${order._id.toString()}_${Date.now()}`;

      const data = {
        total_amount: order.totalAmount,
        currency: 'BDT', // Adjust dynamically if store supports multiple
        tran_id: transactionId, // Use unique tran_id for each api call
        success_url: `${backendUrl}/webhooks/payment/sslcommerz?status=success&orderId=${order._id}`,
        fail_url: `${backendUrl}/webhooks/payment/sslcommerz?status=fail&orderId=${order._id}`,
        cancel_url: `${backendUrl}/webhooks/payment/sslcommerz?status=cancel&orderId=${order._id}`,
        ipn_url: `${backendUrl}/webhooks/payment/sslcommerz?status=ipn`,
        shipping_method: 'Courier',
        product_name: `Order ${order.orderNumber}`,
        product_category: 'E-Commerce',
        product_profile: 'general',
        cus_name: user?.name || order.shippingAddress?.fullName || 'Customer',
        cus_email: order.email || user?.email || 'test@example.com',
        cus_add1: order.shippingAddress?.address || 'Dhaka',
        cus_add2: order.shippingAddress?.addressLine2 || '',
        cus_city: order.shippingAddress?.city || 'Dhaka',
        cus_state: order.shippingAddress?.state || 'Dhaka',
        cus_postcode: order.shippingAddress?.postalCode || '1000',
        cus_country: order.shippingAddress?.country || 'Bangladesh',
        cus_phone: order.shippingAddress?.phone || '01711111111',
        cus_fax: '',
        ship_name: order.shippingAddress?.fullName || 'Customer',
        ship_add1: order.shippingAddress?.address || 'Dhaka',
        ship_add2: order.shippingAddress?.addressLine2 || '',
        ship_city: order.shippingAddress?.city || 'Dhaka',
        ship_state: order.shippingAddress?.state || 'Dhaka',
        ship_postcode: order.shippingAddress?.postalCode || '1000',
        ship_country: order.shippingAddress?.country || 'Bangladesh',
        value_a: order._id.toString(), // Optional custom parameter
      };

      const apiResponse = await sslcz.init(data);
      if (apiResponse?.GatewayPageURL) {
        return {
          success: true,
          provider: this.providerName,
          redirectUrl: apiResponse.GatewayPageURL,
          transactionId: transactionId,
        };
      } else {
        throw new Error('Invalid response from SSLCommerz: ' + JSON.stringify(apiResponse));
      }
    } catch (error) {
      console.error('[SSLCommerz Init Error]:', error.message);
      return { success: false, error: error.message };
    }
  }

  async verifyPayment(verificationData, paymentSetting) {
    const { val_id } = verificationData;
    if (!val_id) {
      return { success: false, message: 'No validation ID provided' };
    }

    try {
      const sslcz = this._getSSLCommerzInstance(paymentSetting);
      const validationResponse = await sslcz.validate({ val_id });

      if (validationResponse?.status === 'VALID' || validationResponse?.status === 'VALIDATED') {
        return { success: true, payload: validationResponse };
      }
      return { success: false, payload: validationResponse };
    } catch (error) {
      console.error('[SSLCommerz Verify Error]:', error.message);
      return { success: false, message: error.message };
    }
  }

  async handleWebhook(req, paymentSetting) {
    // SSLCommerz webhook/callbacks are POST requests with form-urlencoded data.
    // The query param 'status' helps distinguish success/fail/cancel/ipn from our return URL.
    const callbackStatus = req.query.status;
    const orderId = req.query.orderId || req.body.value_a;
    const body = req.body;

    const baseUrl = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000').split(',')[0].trim();

    if (!callbackStatus) {
      throw new Error('Missing status query parameter');
    }

    // IPN handling logic
    if (callbackStatus === 'ipn') {
      const val_id = body.val_id;
      if (!val_id) return { success: false, message: 'Invalid IPN data' };

      const verifyResult = await this.verifyPayment({ val_id }, paymentSetting);
      if (verifyResult.success && orderId) {
        return {
          eventId: body.tran_id || val_id,
          status: 'paid',
          payload: verifyResult.payload,
          orderId,
          amount: verifyResult.payload?.amount ?? body.amount,
          currency: verifyResult.payload?.currency || verifyResult.payload?.currency_type,
          transactionId: body.tran_id || val_id,
        };
      }
      return { success: false, message: 'IPN verification failed', orderId };
    }

    // Explicit cancel/fail logic
    if (callbackStatus === 'fail' || callbackStatus === 'cancel') {
      return {
         eventId: body.tran_id || `${orderId || 'unknown'}:${callbackStatus}`,
         status: 'failed',
         payload: body,
         orderId,
         amount: body.amount,
            currency: body.currency || body.currency_type,
         transactionId: body.tran_id,
         isRedirect: true,
         url: `${baseUrl}/checkout?error=Payment+${callbackStatus}`,
      };
    }

    // Success logic
    if (callbackStatus === 'success') {
      const val_id = body.val_id;
      if (val_id && orderId) {
        const verifyResult = await this.verifyPayment({ val_id }, paymentSetting);
        if (verifyResult.success) {
          return {
            eventId: body.tran_id || val_id,
            status: 'paid',
            payload: verifyResult.payload,
            orderId,
            amount: verifyResult.payload?.amount ?? body.amount,
            currency: verifyResult.payload?.currency || verifyResult.payload?.currency_type,
            transactionId: body.tran_id || val_id,
            isRedirect: true,
            url: `${baseUrl}/success?orderId=${orderId}`
          };
        } else {
          return {
            isRedirect: true,
            url: `${baseUrl}/checkout?error=Payment+Verification+Failed`
          };
        }
      }
    }

    return { success: false, message: `Unhandled status: ${callbackStatus}` };
  }
}

module.exports = SSLCommerzProvider;
