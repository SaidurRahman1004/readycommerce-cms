const PaymentProviderFactory = require('../services/payment/PaymentProviderFactory');
const WebhookEvent = require('../models/WebhookEvent');
const PaymentSetting = require('../models/PaymentSetting');

/**
 * @desc    Handle incoming payment webhooks
 * @route   POST /api/webhooks/payment/:provider
 * @access  Public
 */
exports.handleWebhook = async (req, res) => {
  const { provider } = req.params;
  const tenantId = req.query.tenantId || null; // For multi-tenant webhooks, provider needs to send tenantId in query or payload

  try {
    // 1. Get Provider Implementation
    const paymentProvider = PaymentProviderFactory.getProvider(provider);

    // 2. Fetch Payment Settings for this tenant & provider (to get verification secrets)
    const paymentSetting = await PaymentSetting.findOne({ tenantId, provider });
    if (!paymentSetting || !paymentSetting.enabled) {
      console.warn(`[Webhook] Received webhook for disabled or unknown provider: ${provider}`);
      return res.status(400).send('Provider not configured');
    }

    // 3. Let provider parse the request and extract event ID (Idempotency Key)
    // The provider's handleWebhook should verify signatures BEFORE returning parsed data.
    const parsedEvent = await paymentProvider.handleWebhook(req, paymentSetting);
    
    if (!parsedEvent || !parsedEvent.eventId) {
      return res.status(400).send('Invalid webhook event');
    }

    // 4. Idempotency Check
    let eventRecord = await WebhookEvent.findOne({ provider, eventId: parsedEvent.eventId });
    if (eventRecord) {
      if (eventRecord.status === 'processed') {
        console.log(`[Webhook] Duplicate event ignored: ${parsedEvent.eventId}`);
        return res.status(200).send('Already processed');
      }
      // If pending or failed, we can retry processing it
    } else {
      eventRecord = new WebhookEvent({
        provider,
        eventId: parsedEvent.eventId,
        status: 'pending',
        payload: parsedEvent.payload
      });
      await eventRecord.save();
    }

    // 5. Process the Event (e.g., Update Payment & Order Status)
    // TODO: Implement actual business logic (e.g., finding Payment by transactionId, updating status to paid)
    console.log(`[Webhook] Processing event ${parsedEvent.eventId} with status ${parsedEvent.status}`);
    
    // Mark as processed
    eventRecord.status = 'processed';
    await eventRecord.save();

    res.status(200).send('Webhook handled');
  } catch (error) {
    console.error(`[Webhook Error - ${provider}]:`, error.message);
    // If it's a signature error, return 400. Otherwise 500.
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};
