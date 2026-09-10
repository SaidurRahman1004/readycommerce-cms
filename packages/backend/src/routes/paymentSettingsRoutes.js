const express = require('express');
const router = express.Router();
const { 
  getPaymentSettings, 
  updatePaymentSetting, 
  testPaymentConnection 
} = require('../controllers/paymentSettingsController');

// TODO: Add auth middleware (e.g. protect, authorize('admin'))
// const { protect, authorize } = require('../middleware/auth');
// router.use(protect);
// router.use(authorize('admin'));

router.route('/settings')
  .get(getPaymentSettings);

router.route('/settings/:provider')
  .put(updatePaymentSetting);

router.route('/settings/:provider/test')
  .post(testPaymentConnection);

module.exports = router;
