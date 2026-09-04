const Joi = require('joi');

const paginationSchema = Joi.object({ page: Joi.number().integer().min(1).default(1), limit: Joi.number().integer().min(1).max(100).default(20) });
const addressSchema = Joi.object({
  recipientName: Joi.string().trim().min(2).max(120).required(),
  phone: Joi.string().trim().pattern(/^[+0-9 ()-]{7,20}$/).required(),
  addressLine1: Joi.string().trim().min(3).max(200).required(),
  addressLine2: Joi.string().trim().max(200).allow(''),
  city: Joi.string().trim().min(2).max(80).required(),
  postalCode: Joi.string().trim().max(20).required(),
  country: Joi.string().trim().max(80).default('Bangladesh'),
});

module.exports = { paginationSchema, addressSchema };
