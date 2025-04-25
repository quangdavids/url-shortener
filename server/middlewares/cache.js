const redisClient = require('../config/redis');

/**
 * Middleware to cache URL redirects for better performance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const cacheMiddleware = async (req, res, next) => {
  try {
    const { code } = req.params;
    
    // Check if Redis is connected
    if (!redisClient.isConnected()) {
      console.warn('Redis not connected, skipping cache');
      return next();
    }
    
    // Try to get the URL from cache
    const cachedUrl = await redisClient.get(`url:${code}`);
    
    if (cachedUrl) {
      // URL found in cache, parse the JSON
      const urlData = JSON.parse(cachedUrl);
      
      // Set cache data in response locals
      res.locals.fromCache = true;
      res.locals.urlData = urlData;
      
      return next();
    }
    
    // URL not found in cache, continue to the controller
    next();
  } catch (error) {
    console.error('Cache middleware error:', error);
    next(); // Continue to the controller even if cache fails
  }
};

/**
 * Cache a URL for future requests
 * @param {string} code - URL code
 * @param {Object} urlData - URL data to cache
 * @param {number} expiration - Cache expiration time in seconds
 */
const cacheUrl = async (code, urlData, expiration = process.env.CACHE_EXPIRATION_TIME || 3600) => {
    try {
        // Check if Redis is connected
        if (!redisClient.isConnected()) {
            console.warn('Redis not connected, skipping cache update');
            return;
        }
        
        await redisClient.setex(`url:${code}`, expiration, JSON.stringify(urlData));
    } catch (error) {
        console.error('Error caching URL:', error);
    }
};

/**
 * Remove a URL from the cache
 * @param {string} code - URL code to remove
 */
const invalidateCache = async (code) => {
    try {
        // Check if Redis is connected
        if (!redisClient.isConnected()) {
            console.warn('Redis not connected, skipping cache invalidation');
            return;
        }
        
        await redisClient.del(`url:${code}`);
    } catch (error) {
        console.error('Error invalidating cache:', error);
    }
};

module.exports = {
    cacheMiddleware,
    cacheUrl,
    invalidateCache
};