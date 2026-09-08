const mongoose = require('mongoose');
const RestockLead = require('../models/RestockLead');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const { AppError } = require('../middlewares/errorHandler');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createRestockLead = async (req, res, next) => {
  try {
    const { email, productId, variantId } = req.body;

    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return next(new AppError('Please provide a valid email address.', 400, 'INVALID_EMAIL'));
    }

    if (!productId || !mongoose.isValidObjectId(productId)) {
      return next(new AppError('A valid product ID is required.', 400, 'INVALID_PRODUCT_ID'));
    }

    const productExists = await Product.exists({ _id: productId });
    if (!productExists) {
      return next(new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND'));
    }

    let normalizedVariantId = null;
    if (variantId && mongoose.isValidObjectId(variantId)) {
      const variantExists = await ProductVariant.exists({ _id: variantId, product: productId });
      if (variantExists) {
        normalizedVariantId = variantId;
      }
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingLead = await RestockLead.findOne({
      email: normalizedEmail,
      productId,
      variantId: normalizedVariantId,
    });

    if (existingLead) {
      return res.status(200).json({
        success: true,
        message: "We'll notify you!",
        alreadySubscribed: true,
        data: existingLead,
      });
    }

    try {
      const lead = await RestockLead.create({
        email: normalizedEmail,
        productId,
        variantId: normalizedVariantId,
        status: 'pending',
      });

      return res.status(201).json({
        success: true,
        message: "We'll notify you!",
        data: lead,
      });
    } catch (createError) {
      if (createError.code === 11000) {
        return res.status(200).json({
          success: true,
          message: "We'll notify you!",
          alreadySubscribed: true,
        });
      }
      throw createError;
    }
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createRestockLead,
};
