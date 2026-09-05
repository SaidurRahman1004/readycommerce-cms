const { authMiddleware } = require('./authMiddleware');
const optionalAuth = (req, res, next) => { if (!req.cookies?.rc_access) return next(); return authMiddleware(req, res, (error) => { if (error) { req.user = null; return next(); } return next(); }); };
module.exports = optionalAuth;
