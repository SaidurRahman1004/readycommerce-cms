const User = require('../models/User');
const Session = require('../models/Session');
const { AppError } = require('../middlewares/errorHandler');
const { createAccessToken, createRefreshToken, hashToken } = require('../utils/tokens');

const ACCESS_COOKIE = 'rc_access';
const REFRESH_COOKIE = 'rc_refresh';
const refreshDays = Number(process.env.REFRESH_TOKEN_DAYS || 7);
const cookieOptions = (maxAge, path) => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.COOKIE_SAMESITE || 'lax', maxAge, path });
const safeUser = (user) => ({ id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone, role: user.role, isActive: user.isActive, isEmailVerified: user.isEmailVerified, createdAt: user.createdAt });
const issueSession = async (user, req, res) => {
  const refreshToken = createRefreshToken();
  await Session.create({ user: user._id, tokenHash: hashToken(refreshToken), expiresAt: new Date(Date.now() + refreshDays * 86400000), userAgent: req.get('user-agent'), ipAddress: req.ip });
  res.cookie(ACCESS_COOKIE, createAccessToken(user), cookieOptions(15 * 60 * 1000, '/api'));
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(refreshDays * 86400000, '/api/auth'));
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, firstName, lastName, phone } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() }).lean();
    if (existing) return next(new AppError('An account with this email already exists.', 409, 'EMAIL_IN_USE'));
    const resolvedFirstName = (firstName || name || '').trim().split(/\s+/)[0];
    const resolvedLastName = (lastName || name || '').trim().split(/\s+/).slice(1).join(' ') || resolvedFirstName;
    const user = await User.create({ firstName: resolvedFirstName, lastName: resolvedLastName, email: email.toLowerCase(), password, phone, role: 'customer' });
    await issueSession(user, req, res);
    return res.status(201).json({ success: true, user: safeUser(user) });
  } catch (error) { if (error.code === 11000) return next(new AppError('An account with this email already exists.', 409, 'EMAIL_IN_USE')); return next(error); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) return next(new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS'));
    if (!user.isActive) return next(new AppError('This account is inactive.', 403, 'ACCOUNT_INACTIVE'));
    user.lastLoginAt = new Date(); await user.save();
    await issueSession(user, req, res);
    return res.json({ success: true, user: safeUser(user) });
  } catch (error) { return next(error); }
};

const logout = async (req, res, next) => {
  try { const token = req.cookies?.[REFRESH_COOKIE]; if (token) await Session.updateOne({ tokenHash: hashToken(token), revokedAt: null }, { $set: { revokedAt: new Date() } }); res.clearCookie(ACCESS_COOKIE, { ...cookieOptions(0, '/api'), maxAge: undefined }); res.clearCookie(REFRESH_COOKIE, { ...cookieOptions(0, '/api/auth'), maxAge: undefined }); return res.json({ success: true, message: 'Logged out successfully.' }); } catch (error) { return next(error); }
};

const currentUser = async (req, res) => res.json({ success: true, user: safeUser(req.user) });

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    const session = await Session.findOne({ tokenHash: hashToken(token), revokedAt: null }).select('+tokenHash').populate('user');
    if (!session || session.expiresAt <= new Date() || !session.user?.isActive) return next(new AppError('Session expired.', 401, 'SESSION_EXPIRED'));
    session.revokedAt = new Date(); await session.save(); await issueSession(session.user, req, res);
    return res.json({ success: true, user: safeUser(session.user) });
  } catch (error) { return next(error); }
};

module.exports = { register, login, logout, currentUser, refresh };
