const redirectionService = require('../services/redirectionService');

const redirectUrl = async (req, res) => {
    try {
        const { code } = req.params;
        
        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'URL code is required'
            });
        }
        
        // Check if we have the URL data from cache middleware
        let url;
        if (res.locals.fromCache && res.locals.urlData) {
            url = res.locals.urlData;
            
            // Increment clicks asynchronously for cached requests
            redirectionService.getUrlByCode(code).catch(err => {
                console.error('Error updating click count:', err);
            });
        } else {
            // Not in cache, fetch from database and update clicks
            url = await redirectionService.getUrlByCode(code);
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
        
        // For regular browser requests, perform the redirect
        return res.redirect(url.longUrl);
    } catch (error) {
        console.error('Error redirecting:', error);
        
        // Custom error page for URL not found or expired
        if (error.message === 'URL not found' || error.message === 'URL has expired') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = { 
    redirectUrl 
};