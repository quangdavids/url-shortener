const express = require('express');
const router = express.Router();
const urlController = require('../controllers/urlController');
const { cacheMiddleware } = require('../middlewares/cache');
const rateLimit = require('express-rate-limit');

// Create rate limiter for URL creation
const createUrlLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: { success: false, message: 'Too many requests, please try again later' }
});

// Create a shortened URL
router.post('/shorten', createUrlLimiter, urlController.createUrl);

// Get URL analytics
router.get('/analytics/:code', urlController.getUrlAnalytics);

// Delete a URL
router.delete('/:code', urlController.deleteUrl);

// Export router
module.exports = router;