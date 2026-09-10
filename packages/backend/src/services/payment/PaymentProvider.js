/**
 * Base interface/class for all Payment Providers.
 * Each specific provider (Stripe, bKash, etc.) should extend this class.
 */
class PaymentProvider {
  constructor(providerName) {
    this.providerName = providerName;
  }

  /**
   * Initializes a payment session/intent with the provider.
   * @param {Object} order - The order document
   * @param {Object} paymentSetting - The decrypted payment settings for this provider
   * @returns {Promise<Object>} - Should return the redirect URL, client secret, or transaction reference.
   */
  async initializePayment(order, paymentSetting) {
    throw new Error(`initializePayment() is not implemented for ${this.providerName}`);
  }

  /**
   * Verifies a payment explicitly.
   * @param {Object} verificationData - Data needed to verify (e.g. transaction ID)
   * @param {Object} paymentSetting - The decrypted payment settings for this provider
   * @returns {Promise<Object>} - Verified payment data
   */
  async verifyPayment(verificationData, paymentSetting) {
    throw new Error(`verifyPayment() is not implemented for ${this.providerName}`);
  }

  /**
   * Handles asynchronous webhooks sent by the provider.
   * @param {Object} req - The Express request object
   * @param {Object} paymentSetting - The decrypted payment settings for this provider
   * @returns {Promise<Object>} - Parsed webhook event data (e.g. { eventId, status, payload })
   */
  async handleWebhook(req, paymentSetting) {
    throw new Error(`handleWebhook() is not implemented for ${this.providerName}`);
  }

  /**
   * Refunds a payment.
   * @param {Object} payment - The payment document
   * @param {Number} amount - The amount to refund
   * @param {Object} paymentSetting - The decrypted payment settings for this provider
   * @returns {Promise<Object>} - Refund result
   */
  async refundPayment(payment, amount, paymentSetting) {
    throw new Error(`refundPayment() is not implemented for ${this.providerName}`);
  }
  
  /**
   * Fetches the current status of a payment from the provider.
   * @param {String} transactionId - The transaction ID
   * @param {Object} paymentSetting - The decrypted payment settings for this provider
   * @returns {Promise<String>} - The status
   */
  async getPaymentStatus(transactionId, paymentSetting) {
    throw new Error(`getPaymentStatus() is not implemented for ${this.providerName}`);
  }
}

module.exports = PaymentProvider;
