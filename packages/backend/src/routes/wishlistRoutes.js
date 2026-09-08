const express = require('express');
const cookieParser = require('cookie-parser');
const Joi = require('joi');
const validate = require('../middlewares/validate');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { getWishlist, toggleWishlist, syncWishlist } = require('../controllers/wishlistController');

const router = express.Router();
router.use(cookieParser(), authMiddleware);
router.get('/', getWishlist);
router.post('/toggle', validate(Joi.object({ productId: Joi.string().required() })), toggleWishlist);
router.post('/sync', validate(Joi.object({ productIds: Joi.array().items(Joi.string()).max(100).default([]) })), syncWishlist);

module.exports = router;
