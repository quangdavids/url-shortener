const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('config');

const router = express.Router();
const serviceConfig = config.get('services.shortenURL');

// Configure the proxy middleware
const shortenServiceProxy = createProxyMiddleware({
  target: process.env.SHORTEN_SERVICE_URL || serviceConfig.url,
  changeOrigin: true,
  pathRewrite: serviceConfig.pathRewrite,
  timeout: serviceConfig.timeout,
  onError: (err, req, res) => {
    console.error(`Proxy error with Shorten Service: ${err.message}`);
    res.status(502).json({
      success: false,
      message: 'Shorten Service is currently unavailable'
    });
  }
});

// Apply the proxy to specific routes that match your shortenService
router.use('/shorten', shortenServiceProxy);
router.use('/all', shortenServiceProxy);
router.use('/analytics/:code', shortenServiceProxy);
router.use('/:code', shortenServiceProxy);

// Health check endpoint for this service
router.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'shortenURL' });
});

module.exports = router;