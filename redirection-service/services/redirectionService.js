const Url = require('../../url-service/models/Url');
require('dotenv').config();
// const { getUrlByCode } = require('../services/urlService');
const { cacheUrl, invalidateCache } = require('../../url-service/middlewares/cache');
/**
 * Handle URL redirection based on provided code
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const redirectUrl = async (req, res) => {
    try {
        let url;
        const { code } = req.params;
        
        // Validate the URL code
        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'URL code is required'
            });
        }
        
        // Check if we have URL data from cache middleware
        if (res.locals.fromCache && res.locals.urlData) {
            url = res.locals.urlData;
            
            // Increment clicks asynchronously for cached requests
            getUrlByCode(code).catch(err => {
                console.error('Error updating click count:', err);
            });
        } else {
            // Not in cache, fetch from database and update clicks
            url = await getUrlByCode(code);
        }
        
        // Check if this is an API request from our frontend
        const isApiRequest = req.xhr || req.headers.accept?.includes('application/json');
        
        if (isApiRequest) {
            // Return JSON with URL data for frontend handling
            return res.json({
                success: true,
                longUrl: url.longUrl
            });
        }
        
        // Regular browser request - perform redirect
        return res.redirect(url.longUrl);
        
    } catch (error) {
        console.error('Error redirecting:', error);
        
        // Specific error handling for URL not found or expired
        if (error.message === 'URL not found' || error.message === 'URL has expired') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        // General server error
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

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



module.exports = {
    redirectUrl, 
    getUrlByCode
};