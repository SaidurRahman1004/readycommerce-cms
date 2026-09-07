const mongoose = require('mongoose');
const User = require('../models/User');
const Session = require('../models/Session');
const { AppError } = require('../middlewares/errorHandler');
const { normalizeRole } = require('../middlewares/authMiddleware');

const STAFF_ROLES = ['super-admin', 'manager', 'editor', 'support'];
const STAFF_QUERY_ROLES = ['admin', ...STAFF_ROLES];

const staffDto = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  name: `${user.firstName} ${user.lastName}`.trim(),
  email: user.email,
  role: normalizeRole(user.role),
  isActive: user.isActive,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const assertValidId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw new AppError('Staff member not found.', 404, 'STAFF_NOT_FOUND');
};

const countActiveSuperAdmins = () => User.countDocuments({
  role: { $in: ['admin', 'super-admin'] },
  isActive: true,
});

const listTeam = async (req, res, next) => {
  try {
    const staff = await User.find({ role: { $in: STAFF_QUERY_ROLES } })
      .select('_id firstName lastName email role isActive lastLoginAt createdAt updatedAt')
      .sort({ role: 1, createdAt: 1 })
      .lean();
    return res.json({
      success: true,
      data: staff.map(staffDto),
      meta: { currentUserId: String(req.user._id) },
    });
  } catch (error) { return next(error); }
};

const createStaff = async (req, res, next) => {
  try {
    const email = req.body.email.trim().toLowerCase();
    if (await User.exists({ email })) return next(new AppError('An account with this email already exists.', 409, 'EMAIL_IN_USE'));
    const user = await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email,
      password: req.body.password,
      role: req.body.role,
      isActive: true,
      isEmailVerified: false,
    });
    return res.status(201).json({ success: true, data: staffDto(user) });
  } catch (error) {
    if (error.code === 11000) return next(new AppError('An account with this email already exists.', 409, 'EMAIL_IN_USE'));
    return next(error);
  }
};

const updateStaff = async (req, res, next) => {
  try {
    assertValidId(req.params.id);
    const staff = await User.findOne({ _id: req.params.id, role: { $in: STAFF_QUERY_ROLES } });
    if (!staff) return next(new AppError('Staff member not found.', 404, 'STAFF_NOT_FOUND'));

    const isSelf = staff._id.equals(req.user._id);
    const nextRole = req.body.role || normalizeRole(staff.role);
    const nextActive = req.body.isActive ?? staff.isActive;
    if (isSelf && (nextRole !== 'super-admin' || !nextActive)) {
      return next(new AppError('You cannot demote or deactivate your own account.', 409, 'SELF_ACCESS_PROTECTED'));
    }

    const removesSuperAdmin = normalizeRole(staff.role) === 'super-admin' && (nextRole !== 'super-admin' || !nextActive);
    if (removesSuperAdmin && await countActiveSuperAdmins() <= 1) {
      return next(new AppError('At least one active super-admin is required.', 409, 'LAST_SUPER_ADMIN'));
    }

    const accessChanged = normalizeRole(staff.role) !== nextRole || staff.isActive !== nextActive;
    staff.role = nextRole;
    staff.isActive = nextActive;
    await staff.save();
    if (accessChanged) {
      await Session.updateMany({ user: staff._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
    }
    return res.json({ success: true, data: staffDto(staff) });
  } catch (error) { return next(error); }
};

const revokeStaff = async (req, res, next) => {
  try {
    assertValidId(req.params.id);
    if (String(req.params.id) === String(req.user._id)) {
      return next(new AppError('You cannot remove your own account.', 409, 'SELF_DELETE_PROTECTED'));
    }
    const staff = await User.findOne({ _id: req.params.id, role: { $in: STAFF_QUERY_ROLES } });
    if (!staff) return next(new AppError('Staff member not found.', 404, 'STAFF_NOT_FOUND'));
    if (normalizeRole(staff.role) === 'super-admin' && staff.isActive && await countActiveSuperAdmins() <= 1) {
      return next(new AppError('At least one active super-admin is required.', 409, 'LAST_SUPER_ADMIN'));
    }

    // Preserve the staff identity, role, and audit references while immediately
    // revoking authentication. A super-admin can reactivate the account later.
    staff.isActive = false;
    await staff.save();
    await Session.updateMany({ user: staff._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
    return res.json({ success: true, message: 'Staff access revoked.', data: staffDto(staff) });
  } catch (error) { return next(error); }
};

module.exports = { listTeam, createStaff, updateStaff, revokeStaff, STAFF_ROLES };
