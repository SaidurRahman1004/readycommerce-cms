const User = require('../models/User');
const { AppError } = require('../middlewares/errorHandler');

const safeUser = (user) => ({ id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone, role: user.role, isActive: user.isActive, isEmailVerified: user.isEmailVerified, createdAt: user.createdAt });
const getProfile = async (req, res) => res.json({ success: true, user: safeUser(req.user) });
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, { $set: req.body }, { new: true, runValidators: true });
    if (!user) return next(new AppError('User not found.', 404, 'USER_NOT_FOUND'));
    return res.json({ success: true, user: safeUser(user) });
  } catch (error) { return next(error); }
};
module.exports = { getProfile, updateProfile };
