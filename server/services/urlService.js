const Url = require('../models/Url');
const { generateShortId } = require('../utils/shortIdGenerator');
const { isValidUrl } = require('../utils/validator');
const { cacheUrl, invalidateCache } = require('../middlewares/cache');
require('dotenv').config();

/**
 * Create a shortened URL
 * @param {string} longUrl - The original URL to shorten
 * @returns {Object} - The created URL object
 */
const createShortUrl = async (longUrl) => {
    // Validate URL
    if (!isValidUrl(longUrl)) {
        throw new Error('Invalid URL provided');
    }

    // Check if URL already exists in the database
    const existingUrl = await Url.findOne({ longUrl });
    if (existingUrl) {
        // Update cache with the existing URL
        await cacheUrl(existingUrl.urlCode, existingUrl);
        return existingUrl;
    }

    // Generate a unique URL code
    const urlCode = generateShortId();
    const baseUrl = process.env.BASE_URL;
    const shortUrl = `${baseUrl}/${urlCode}`;

    // Calculate expiration date (default 30 days)
    const expirationDays = parseInt(process.env.URL_EXPIRATION_TIME) || 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    // Create new URL document
    const url = new Url({
        urlCode,
        longUrl,
        shortUrl,
        expiresAt
    });

    // Save to database
    const savedUrl = await url.save();
    
    // Cache the newly created URL
    await cacheUrl(urlCode, savedUrl);
    
    return savedUrl;
};

/**
 * Get a URL by its code
 * @param {string} urlCode - The URL code to lookup
 * @returns {Object} - The URL object if found
 */
const getUrlByCode = async (urlCode) => {
  // Find URL in database
    const url = await Url.findOne({ urlCode });
    
    if (!url) {
        throw new Error('URL not found');
    }
    
    // Check if URL has expired
    if (url.expiresAt < new Date()) {
        // Remove expired URL from cache and database
        await invalidateCache(urlCode);
        await Url.deleteOne({ _id: url._id });
        throw new Error('URL has expired');
    }
    
    // Increment click count and update last accessed
    url.clicks += 1;
    await url.save();
    
    // Update cache with the latest data
    await cacheUrl(urlCode, url);
    
    return url;
};

/**
 * Get URL analytics
 * @param {string} urlCode - The URL code to get analytics for
 * @returns {Object} - URL analytics data
 */
const getUrlAnalytics = async (urlCode) => {
    const url = await Url.findOne({ urlCode });
    
    if (!url) {
        throw new Error('URL not found');
    }
    
    return {
        urlCode: url.urlCode,
        longUrl: url.longUrl,
        shortUrl: url.shortUrl,
        clicks: url.clicks,
        createdAt: url.createdAt,
        expiresAt: url.expiresAt
    };
};

/**
 * Delete a URL by its code
 * @param {string} urlCode - The URL code to delete
 * @returns {boolean} - True if deleted successfully
 */
const deleteUrl = async (urlCode) => {
    const result = await Url.deleteOne({ urlCode });
    
    if (result.deletedCount === 0) {
        throw new Error('URL not found');
    }
    
    // Remove from cache
    await invalidateCache(urlCode);
    
    return true;
};

module.exports = {
    createShortUrl,
    getUrlByCode,
    getUrlAnalytics,
    deleteUrl
};