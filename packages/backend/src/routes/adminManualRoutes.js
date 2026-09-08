const express = require('express');
const { authorize } = require('../middlewares/authMiddleware');
const controller = require('../controllers/manualController');

const router = express.Router();
const EDIT_ROLES = ['super-admin', 'manager', 'editor'];
router.get('/', authorize(...EDIT_ROLES), controller.list);
router.post('/', authorize(...EDIT_ROLES), controller.create);
router.put('/:id', authorize(...EDIT_ROLES), controller.update);
router.delete('/:id', authorize(...EDIT_ROLES), controller.remove);

module.exports = router;
