const User = require('../models/User');
const { AppError } = require('./errorHandler');
const { verifyAccessToken } = require('../utils/tokens');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.rc_access;
    if (!token) return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    req.user = user;
    return next();
  } catch (error) { return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED')); }
};

const authorize = (...roles) => (req, res, next) => (req.user && roles.includes(req.user.role) ? next() : next(new AppError('You are not allowed to access this resource.', 403, 'FORBIDDEN')));
module.exports = { authMiddleware, authorize };
