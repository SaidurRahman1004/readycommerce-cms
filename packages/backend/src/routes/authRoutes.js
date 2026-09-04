const express = require('express');
const Joi = require('joi');
const cookieParser = require('cookie-parser');
const validate = require('../middlewares/validate');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { register, login, logout, currentUser, refresh } = require('../controllers/authController');

const router = express.Router();
const registration = Joi.object({ name: Joi.string().trim().min(2).max(120), firstName: Joi.string().trim().min(2).max(60), lastName: Joi.string().trim().min(2).max(60), email: Joi.string().trim().lowercase().email().required(), password: Joi.string().min(8).max(128).required(), phone: Joi.string().trim().max(25).allow('') }).or('name', 'firstName');
const credentials = Joi.object({ email: Joi.string().trim().lowercase().email().required(), password: Joi.string().min(1).max(128).required() });

router.use(cookieParser());
router.post('/register', validate(registration), register);
router.post('/login', validate(credentials), login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', authMiddleware, currentUser);
module.exports = router;
