const express = require('express');
const cookieParser = require('cookie-parser');
const { authMiddleware, authorize } = require('../middlewares/authMiddleware');
const router = express.Router();
const { 
  getManualPaymentRequests, 
  updatePaymentStatus 
} = require('../controllers/manualPaymentController');

router.use(cookieParser(), authMiddleware, authorize('super-admin', 'manager'));

router.route('/')
  .get(getManualPaymentRequests);

router.route('/:id/status')
  .put(updatePaymentStatus);

module.exports = router;
