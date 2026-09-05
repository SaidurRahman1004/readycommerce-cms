const express = require('express');
const cookieParser = require('cookie-parser');
const { authMiddleware, authorize, normalizeRole, STAFF_ROLES } = require('../middlewares/authMiddleware');
const { getOverview } = require('../controllers/adminController');
const { listOrders, getOrder, updateStatus, updatePayment } = require('../controllers/adminOrderController');
const catalog = require('../controllers/adminCatalogController');
const customer = require('../controllers/adminCustomerController');
const moderation = require('../controllers/adminReviewCouponController');
const cms = require('../controllers/adminCmsController');
const settings = require('../controllers/adminSettingsController');
const auditLogger = require('../middlewares/auditLogger');
const audit = require('../controllers/auditLogController');
const refund = require('../controllers/adminRefundController');
const teamRoutes = require('./adminTeamRoutes');

const router = express.Router();
const SUPER_ADMIN = ['super-admin'];
const ORDER_ROLES = ['super-admin', 'manager', 'support'];
const CATALOG_ROLES = ['super-admin', 'manager', 'editor'];
const CUSTOMER_ROLES = ['super-admin', 'manager', 'support'];
const REVIEW_ROLES = ['super-admin', 'manager', 'editor', 'support'];
const PROMOTION_ROLES = ['super-admin', 'manager', 'editor'];
const CMS_ROLES = ['super-admin', 'editor'];

router.use(cookieParser(), authMiddleware, authorize(...STAFF_ROLES));
router.use(auditLogger);

router.get('/access', (req, res) => res.json({
  success: true,
  data: {
    authorized: true,
    user: {
      id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: normalizeRole(req.user.role),
    },
  },
}));
router.get('/overview', getOverview);

router.get('/orders', authorize(...ORDER_ROLES), listOrders);
router.get('/orders/:id', authorize(...ORDER_ROLES), getOrder);
router.put('/orders/:id/status', authorize(...ORDER_ROLES), updateStatus);
router.put('/orders/:id/payment', authorize(...ORDER_ROLES), updatePayment);
router.put('/orders/:id/refund', authorize(...ORDER_ROLES), refund.refund);

router.get('/products', authorize(...CATALOG_ROLES), catalog.listProducts);
router.post('/products', authorize(...CATALOG_ROLES), catalog.createProduct);
router.put('/products/:id', authorize(...CATALOG_ROLES), catalog.updateProduct);
router.delete('/products/:id', authorize(...CATALOG_ROLES), catalog.archiveProduct);
router.get('/inventory', authorize(...CATALOG_ROLES), catalog.listInventory);
router.put('/inventory/:id', authorize(...CATALOG_ROLES), catalog.updateInventory);
router.get('/categories', authorize(...CATALOG_ROLES), customer.listCategories);
router.post('/categories', authorize(...CATALOG_ROLES), customer.createCategory);
router.put('/categories/:id', authorize(...CATALOG_ROLES), customer.updateCategory);
router.delete('/categories/:id', authorize(...CATALOG_ROLES), customer.deleteCategory);

router.get('/customers', authorize(...CUSTOMER_ROLES), customer.listCustomers);
router.get('/customers/:id', authorize(...CUSTOMER_ROLES), customer.getCustomer);
router.put('/customers/:id/status', authorize(...CUSTOMER_ROLES), customer.updateCustomerStatus);
router.get('/reviews', authorize(...REVIEW_ROLES), moderation.listReviews);
router.put('/reviews/:id/status', authorize(...REVIEW_ROLES), moderation.reviewStatus);
router.delete('/reviews/:id', authorize(...REVIEW_ROLES), moderation.deleteReview);
router.get('/coupons', authorize(...PROMOTION_ROLES), moderation.listCoupons);
router.post('/coupons', authorize(...PROMOTION_ROLES), moderation.createCoupon);
router.put('/coupons/:id', authorize(...PROMOTION_ROLES), moderation.updateCoupon);
router.delete('/coupons/:id', authorize(...PROMOTION_ROLES), moderation.deleteCoupon);
router.get('/cms/homepage', authorize(...CMS_ROLES), cms.get);
router.put('/cms/homepage', authorize(...CMS_ROLES), cms.update);

router.get('/settings', authorize(...SUPER_ADMIN), settings.get);
router.put('/settings', authorize(...SUPER_ADMIN), settings.update);
router.get('/audit-logs', authorize(...SUPER_ADMIN), audit.list);
router.use('/team', authorize(...SUPER_ADMIN), teamRoutes);

module.exports = router;
