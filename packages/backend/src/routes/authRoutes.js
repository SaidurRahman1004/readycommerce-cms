const express = require('express');
const Joi = require('joi');
const cookieParser = require('cookie-parser');
const validate = require('../middlewares/validate');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { register, login, logout, currentUser, refresh, forgotPassword, resetPassword, changePassword } = require('../controllers/authController');

const router = express.Router();
const registration = Joi.object({ name: Joi.string().trim().min(2).max(120), firstName: Joi.string().trim().min(2).max(60), lastName: Joi.string().trim().min(2).max(60), email: Joi.string().trim().lowercase().email().required(), password: Joi.string().min(8).max(128).required(), phone: Joi.string().trim().max(25).allow('') }).or('name', 'firstName');
const credentials = Joi.object({ email: Joi.string().trim().lowercase().email().required(), password: Joi.string().min(1).max(128).required() });
const forgotSchema = Joi.object({ email: Joi.string().trim().lowercase().email().required() });
const resetSchema = Joi.object({ token: Joi.string().hex().length(64).required(), password: Joi.string().min(8).max(128).required() });
const changeSchema = Joi.object({ currentPassword: Joi.string().min(1).max(128).required(), newPassword: Joi.string().min(8).max(128).required() });

router.use(cookieParser());
router.post('/register', validate(registration), register);
router.post('/login', validate(credentials), login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.post('/forgot-password', validate(forgotSchema), forgotPassword);
router.post('/reset-password', validate(resetSchema), resetPassword);
router.post('/change-password', authMiddleware, validate(changeSchema), changePassword);
router.get('/me', authMiddleware, currentUser);
module.exports = router;
