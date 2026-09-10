const StripeProvider = require('./providers/StripeProvider');
const SSLCommerzProvider = require('./providers/SSLCommerzProvider');
const BKashProvider = require('./providers/BKashProvider');
// Other imports like ManualProvider, CODProvider

class PaymentProviderFactory {
  static getProvider(providerName) {
    switch (providerName.toLowerCase()) {
      case 'stripe':
        return new StripeProvider();
      case 'sslcommerz':
        return new SSLCommerzProvider();
      case 'bkash':
        return new BKashProvider();
      // case 'manual':
      //   return new ManualProvider();
      // case 'cod':
      //   return new CODProvider();
      default:
        throw new Error(`Unsupported payment provider: ${providerName}`);
    }
  }
}

module.exports = PaymentProviderFactory;
