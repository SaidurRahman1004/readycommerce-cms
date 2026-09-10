const axios = require('axios');
const PaymentProvider = require('../PaymentProvider');

class BKashProvider extends PaymentProvider {
  constructor() {
    super('bkash');
  }

  getBaseUrl(mode) {
    return mode === 'live' 
      ? 'https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized'
      : 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized';
  }

  async getAuthToken(paymentSetting) {
    const credentials = paymentSetting.getDecryptedCredentials();
    if (!credentials || !credentials.app_key || !credentials.app_secret || !credentials.username || !credentials.password) {
      throw new Error('Incomplete bKash credentials in payment settings.');
    }

    const baseUrl = this.getBaseUrl(paymentSetting.mode);
    
    try {
      const response = await axios.post(`${baseUrl}/checkout/token/grant`, {
        app_key: credentials.app_key,
        app_secret: credentials.app_secret
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'username': credentials.username,
          'password': credentials.password
        }
      });
      
      if (response.data && response.data.id_token) {
        return response.data.id_token;
      } else {
        throw new Error(response.data.statusMessage || 'Failed to generate bKash token');
      }
    } catch (error) {
      console.error('[bKash] Token Generation Error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with bKash API');
    }
  }

  async initializePayment(order, paymentSetting) {
    const credentials = paymentSetting.getDecryptedCredentials();
    const token = await this.getAuthToken(paymentSetting);
    const baseUrl = this.getBaseUrl(paymentSetting.mode);

    // Build absolute callback URL using the order tenantId if available, fallback to a global URL structure
    const appBaseUrl = process.env.API_URL || 'http://localhost:5000';
    let callbackUrl = `${appBaseUrl}/api/webhooks/payment/bkash`;
    if (order.tenantId) {
      callbackUrl += `?tenantId=${order.tenantId}`;
    }

    try {
      const response = await axios.post(`${baseUrl}/checkout/create`, {
        mode: '0011', // 0011 means checkout
        payerReference: order.customerId?.toString() || 'guest',
        callbackURL: callbackUrl,
        amount: order.total.toFixed(2),
        currency: 'BDT', // bKash only supports BDT
        intent: 'sale',
        merchantInvoiceNumber: order._id.toString()
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token,
          'X-APP-Key': credentials.app_key
        }
      });

      if (response.data && response.data.bkashURL) {
        return {
          redirectUrl: response.data.bkashURL,
          paymentReference: response.data.paymentID
        };
      } else {
        throw new Error(response.data.statusMessage || 'Failed to create bKash payment');
      }
    } catch (error) {
      console.error('[bKash] Create Payment Error:', error.response?.data || error.message);
      throw new Error('Failed to initialize bKash payment');
    }
  }

  async handleWebhook(req, paymentSetting) {
    // bKash webhook redirects to the callbackUrl with query parameters
    // Format: ?paymentID=TRX123&status=success&apiVersion=1.2.0-beta
    const { paymentID, status } = req.query;
    
    // The Storefront base URL where we want to redirect the user after processing
    const storefrontUrl = process.env.STOREFRONT_URL || 'http://localhost:3000';

    if (!paymentID) {
      return { isRedirect: true, url: `${storefrontUrl}/checkout?error=invalid_payment_id` };
    }

    if (status === 'cancel' || status === 'failure') {
      return { isRedirect: true, url: `${storefrontUrl}/checkout?error=payment_${status}` };
    }

    if (status === 'success') {
      try {
        // We must execute the payment to capture the funds
        const credentials = paymentSetting.getDecryptedCredentials();
        const token = await this.getAuthToken(paymentSetting);
        const baseUrl = this.getBaseUrl(paymentSetting.mode);

        const response = await axios.post(`${baseUrl}/checkout/execute`, {
          paymentID: paymentID
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': token,
            'X-APP-Key': credentials.app_key
          }
        });

        if (response.data && response.data.statusCode === '0000' && response.data.trxID) {
          // Execution successful
          return {
            eventId: response.data.trxID, // Idempotency
            status: 'paid',
            payload: response.data, // Contains merchantInvoiceNumber (our order ID)
            orderId: response.data.merchantInvoiceNumber,
            amount: response.data.amount,
            currency: response.data.currency || 'BDT',
            transactionId: response.data.trxID,
            isRedirect: true,
            url: `${storefrontUrl}/success?orderId=${response.data.merchantInvoiceNumber}`
          };
        } else {
          console.error('[bKash] Execution Failed:', response.data);
          return { isRedirect: true, url: `${storefrontUrl}/checkout?error=execution_failed` };
        }
      } catch (error) {
        console.error('[bKash] Execution Error:', error.response?.data || error.message);
        return { isRedirect: true, url: `${storefrontUrl}/checkout?error=execution_error` };
      }
    }

    // Default catch-all
    return { isRedirect: true, url: `${storefrontUrl}/checkout?error=unknown_status` };
  }
}

module.exports = BKashProvider;
