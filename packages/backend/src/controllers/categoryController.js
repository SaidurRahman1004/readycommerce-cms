const Category = require('../models/Category');
const { AppError } = require('../middlewares/errorHandler');

const listCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
    return res.json({ success: true, data: categories });
  } catch (error) { return next(error); }
};

module.exports = { listCategories, categoryNotFound: () => { throw new AppError('Category not found.', 404, 'CATEGORY_NOT_FOUND'); } };
