const express = require('express');
const router = express.Router();
const { handleWebhook } = require('../controllers/webhookController');

// Note: Webhook routes must often bypass global JSON parsing if the provider requires raw bodies for signature verification (e.g. Stripe).
// For this foundation, we'll assume the provider logic handles raw body conversion if needed, or we use express.raw() conditionally.

router.post('/payment/:provider', handleWebhook);

module.exports = router;
