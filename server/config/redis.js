const Redis = require('ioredis');
require('dotenv').config();

// Default Redis configuration
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    // Add a timeout to prevent hanging
    connectTimeout: 10000,
    // Add a max retries limit
    maxRetriesPerRequest: 3
};

// Create Redis client
const redisClient = new Redis(redisConfig);

redisClient.on('connect', () => {
    console.log('Redis client connected');
});

redisClient.on('error', (err) => {
    console.error('Redis client error:', err);
});

// Add a method to check if Redis is connected
redisClient.isConnected = () => {
    return redisClient.status === 'ready';
};

module.exports = redisClient;