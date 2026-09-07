const Redis = require('ioredis');
const logger = require('./logger');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// We wrap it in try-catch to avoid crashing if Redis is completely unavailable in dev.
let redis = null;
try {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) {
        logger.error('Redis connection failed after 3 retries. Caching will be disabled.');
        return null; // Stop retrying
      }
      return Math.min(times * 100, 3000);
    },
    lazyConnect: true // Do not connect immediately if not required, or connect gracefully
  });

  redis.on('error', (err) => {
    logger.warn('Redis Error (caching disabled if disconnected): ' + err.message);
  });

  redis.on('connect', () => {
    logger.info('Connected to Redis server.');
  });
  
  // attempt to connect
  redis.connect().catch(() => {});
} catch (error) {
  logger.warn('Failed to initialize Redis client. Caching will be disabled.');
}

const clearCatalogCache = async () => {
  if (redis && redis.status === 'ready') {
    try {
      const keys = await redis.keys('catalog:*');
      if (keys.length > 0) {
        await redis.del(keys);
        logger.info(`Cleared ${keys.length} catalog cache keys.`);
      }
    } catch (error) {
      logger.error('Failed to clear catalog cache:', error);
    }
  }
};

module.exports = { client: redis, clearCatalogCache };
