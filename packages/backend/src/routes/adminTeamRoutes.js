const express = require('express');
const Joi = require('joi');
const validate = require('../middlewares/validate');
const { listTeam, createStaff, updateStaff, revokeStaff, STAFF_ROLES } = require('../controllers/adminTeamController');

const router = express.Router();
const role = Joi.string().valid(...STAFF_ROLES);
const createSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(60).required(),
  lastName: Joi.string().trim().min(2).max(60).required(),
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(10).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/).required().messages({
    'string.pattern.base': 'Password must include uppercase, lowercase, number, and symbol.',
  }),
  role: role.required(),
});
const updateSchema = Joi.object({
  role,
  isActive: Joi.boolean(),
}).min(1);

router.get('/', listTeam);
router.post('/', validate(createSchema), createStaff);
router.put('/:id', validate(updateSchema), updateStaff);
router.delete('/:id', revokeStaff);

module.exports = router;
