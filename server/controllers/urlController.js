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
const redirectUrl = async (req, res) => {
    try {
        // Check if we have the URL data from cache middleware
        if (res.locals.fromCache && res.locals.urlData) {
            // Increment clicks asynchronously
            urlService.getUrlByCode(res.locals.urlData.urlCode).catch(err => {
                console.error('Error updating click count:', err);
            });
            
            return res.redirect(res.locals.urlData.longUrl);
        }
        
        // Not in cache, fetch from database
        const { code } = req.params;
        if (!code) {
            throw new Error('URL code is required');
        }
        
        const url = await urlService.getUrlByCode(code);
        
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