const Category = require('../models/Category');
const { AppError } = require('../middlewares/errorHandler');
const { client: redis } = require('../config/redis');

const listCategories = async (req, res, next) => {
  try {
    const cacheKey = 'catalog:categories';
    if (redis && redis.status === 'ready') {
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.set('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
      }
    }

    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
    
    const responseData = { success: true, data: categories };
    if (redis && redis.status === 'ready') {
      await redis.setex(cacheKey, 3600, JSON.stringify(responseData)); // 1 hour
    }
    res.set('X-Cache', 'MISS');
    return res.json(responseData);
  } catch (error) { return next(error); }
};

module.exports = { listCategories, categoryNotFound: () => { throw new AppError('Category not found.', 404, 'CATEGORY_NOT_FOUND'); } };
