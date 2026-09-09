const express = require('express');
const cookieParser = require('cookie-parser');
const { authMiddleware, authorize, STAFF_ROLES } = require('../middlewares/authMiddleware');
const controller = require('../controllers/manualController');

const router = express.Router();
const EDIT_ROLES = ['super-admin', 'manager', 'editor'];
router.use(cookieParser(), authMiddleware);

router.get('/', authorize(...STAFF_ROLES), controller.list);
router.get('/:id', authorize(...STAFF_ROLES), controller.getById);
router.post('/', authorize(...EDIT_ROLES), controller.create);
router.put('/:id', authorize(...EDIT_ROLES), controller.update);
router.delete('/:id', authorize(...EDIT_ROLES), controller.remove);

module.exports = router;
