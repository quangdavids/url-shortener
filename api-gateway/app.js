const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('config');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

// Load environment variables
dotenv.config();

// Import routes
const shortenServiceRoutes = require('./routes/shortenService');
const redirectServiceRoutes = require('./routes/redirectService');

// Create Express application
const app = express();

// Configure rate limiting
const limiter = rateLimit({
  windowMs: config.get('rateLimit.windowMs'),
  max: config.get('rateLimit.max'),
  standardHeaders: true,
  message: {
    error: true,
    status: 429,
    message: 'Too many requests from this IP, please try again later'
  }
});

// Apply global middleware
app.use(helmet()); // Security headers
app.use(cors(config.get('cors'))); // CORS configuration
app.use(express.json()); // Parse JSON request bodies
app.use(morgan('dev')); // Basic logging
app.use(limiter); // Rate limiting

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date()
  });
});

// Mount service routes
app.use('/api', shortenServiceRoutes);
app.use('/', redirectServiceRoutes); 

// Catch-all for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: true,
    status: 404,
    message: 'The requested resource was not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    status: 500,
    message: 'Internal Server Error'
  });
});

module.exports = app;