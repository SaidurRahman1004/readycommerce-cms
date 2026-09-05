const express = require('express');
const cookieParser = require('cookie-parser');
const { authMiddleware, authorize } = require('../middlewares/authMiddleware');
const router = express.Router();
router.use(cookieParser(), authMiddleware, authorize('admin'));
router.get('/access', (req, res) => res.json({ success: true, data: { authorized: true, user: { id: req.user._id, firstName: req.user.firstName, lastName: req.user.lastName, email: req.user.email, role: req.user.role } } }));
module.exports = router;
