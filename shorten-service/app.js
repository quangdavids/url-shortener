const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const urlRoutes = require('../shorten-service/routes/urlRoutes');
const urlController = require('../shorten-service/controllers/urlController');
const { cacheMiddleware } = require('../shorten-service/middlewares/cache');

// Create Express app
const app = express();

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors({origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], 
    credentials: true})); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// API routes
app.use('/api/url', urlRoutes);


// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Resource not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
});

module.exports = app;