const express = require('express');
const Joi = require('joi');
const validate = require('../middlewares/validate');
const { validateCoupon } = require('../controllers/couponController');
const router = express.Router();
router.post('/validate', validate(Joi.object({ code: Joi.string().trim().min(3).max(40).required(), orderAmount: Joi.number().min(0).required() })), validateCoupon);
module.exports = router;
