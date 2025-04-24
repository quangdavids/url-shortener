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
    
    // Try to get the URL from cache
    const cachedUrl = await redisClient.get(`url:${code}`);
    
    if (cachedUrl) {
      // URL found in cache, parse the JSON
      const urlData = JSON.parse(cachedUrl);
      
      // Increment click count in database asynchronously without waiting
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
const cacheUrl = async (code, urlData, expiration = process.env.CACHE_EXPIRATION_TIME) => {
    try {
        await redisClient.setex(`url:${code}`, expiration, JSON.stringify(urlData));
    } catch (error) {
        console.error('Error caching URL:', error);
    }
};

/**
 * Remove a URL from the cache
 * @param {string} code - URL code to remove from cache
 */
const invalidateCache = async (code) => {
    try {
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