const urlService = require('../services/urlService');

/**
 * Create a shortened URL
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createUrl = async (req, res) => {
    try {
        const { longUrl } = req.body;
        
        if (!longUrl) {
        return res.status(400).json({ 
            success: false, 
            message: 'Please provide a URL to shorten' 
        });
        }
        
        const url = await urlService.createShortUrl(longUrl);
        
        res.status(201).json({
        success: true,
        data: url
        });
    } catch (error) {
        console.error('Error creating short URL:', error);
        res.status(error.message === 'Invalid URL provided' ? 400 : 500).json({
        success: false,
        message: error.message || 'Server error'
        });
    }
};

/**
 * Redirect to the original URL
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
// In your urlController.js - modify the redirectUrl function
const redirectUrl = async (req, res) => {
    try {
        let url;
        const { code } = req.params;
        
        // Check if we have the URL data from cache middleware
        if (res.locals.fromCache && res.locals.urlData) {
            url = res.locals.urlData;
            
            // Increment clicks asynchronously for ALL requests (cached)
            urlService.getUrlByCode(url.urlCode).catch(err => {
                console.error('Error updating click count:', err);
            });
        } else {
            // Not in cache, fetch from database
            if (!code) {
                throw new Error('URL code is required');
            }
            
            // This call to getUrlByCode will increment the click count
            url = await urlService.getUrlByCode(code);
        }
        
        // Check if this is an API request from our frontend
        const isApiRequest = req.xhr || req.headers.accept?.includes('application/json');
        
        if (isApiRequest) {
            // Return JSON with the URL for frontend to handle the redirect
            return res.json({
                success: true,
                longUrl: url.longUrl
            });
        }
        
        // Regular browser request - do the redirect
        res.redirect(url.longUrl);
    } catch (error) {
        console.error('Error redirecting:', error);
        
        // Custom error page for URL not found or expired
        if (error.message === 'URL not found' || error.message === 'URL has expired') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
/**
 * Get URL analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUrlAnalytics = async (req, res) => {
    try {
        const { code } = req.params;
        const analytics = await urlService.getUrlAnalytics(code);
        
        res.json({
        success: true,
        data: analytics
        });
    } catch (error) {
        console.error('Error getting URL analytics:', error);
        
        res.status(error.message === 'URL not found' ? 404 : 500).json({
        success: false,
        message: error.message || 'Server error'
        });
    }
};

/**
 * Delete a URL
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteUrl = async (req, res) => {
    try {
        const { code } = req.params;
        await urlService.deleteUrl(code);
        
        res.json({
        success: true,
        message: 'URL deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting URL:', error);
        
        res.status(error.message === 'URL not found' ? 404 : 500).json({
        success: false,
        message: error.message || 'Server error'
        });
    }
};

// Generate a function that gets all URLs
const getAllUrls = async (req, res) => {
    try {
        const urls = await urlService.getAllUrls();
        
        res.json({
            success: true,
            data: urls
        });
    } catch (error) {
        console.error('Error getting all URLs:', error);
        
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};


module.exports = {
    createUrl,
    redirectUrl,
    getUrlAnalytics,
    deleteUrl,
    getAllUrls
};