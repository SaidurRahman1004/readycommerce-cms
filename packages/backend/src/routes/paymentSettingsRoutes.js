const express = require('express');
const cookieParser = require('cookie-parser');
const { authMiddleware, authorize } = require('../middlewares/authMiddleware');
const router = express.Router();
const { 
  getPaymentSettings, 
  updatePaymentSetting, 
  testPaymentConnection 
} = require('../controllers/paymentSettingsController');

router.use(cookieParser(), authMiddleware, authorize('super-admin', 'manager'));

router.route('/settings')
  .get(getPaymentSettings);

router.route('/settings/:provider')
  .put(updatePaymentSetting);

router.route('/settings/:provider/test')
  .post(testPaymentConnection);

module.exports = router;
