const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const requiredSecret = (name) => {
  const secret = process.env[name];
  if (!secret) throw new Error(`${name} is not configured`);
  return secret;
};

const createAccessToken = (user) => jwt.sign(
  { sub: user._id.toString(), role: user.role, type: 'access' },
  requiredSecret('JWT_ACCESS_SECRET'),
  { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m' },
);

const createRefreshToken = () => crypto.randomBytes(48).toString('base64url');
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const verifyAccessToken = (token) => jwt.verify(token, requiredSecret('JWT_ACCESS_SECRET'), { algorithms: ['HS256'] });

module.exports = { createAccessToken, createRefreshToken, hashToken, verifyAccessToken };
