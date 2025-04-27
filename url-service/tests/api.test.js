const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Url = require('../models/Url');
const { generateShortId } = require('../utils/shortIdGenerator');

// Mock external dependencies
jest.mock('../utils/shortIdGenerator');
jest.mock('../config/redis', () => ({
  get: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  on: jest.fn()
}));

describe('URL Shortener API', () => {
    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/url-shortener-test', {
        useNewUrlParser: true,
        useUnifiedTopology: true
        });
    });

    afterAll(async () => {
        // Clean up and disconnect
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Clear database between tests
        await Url.deleteMany({});
        
        // Mock shortId generator
        generateShortId.mockReturnValue('testcode');
    });

    describe('POST /api/url/shorten', () => {
        test('should create a shortened URL', async () => {
            const response = await request(app)
                .post('/api/url/shorten')
                .send({ longUrl: 'https://example.com' });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('urlCode', 'testcode');
            expect(response.body.data).toHaveProperty('longUrl', 'https://example.com');
        });

        test('should return 400 for invalid URL', async () => {
            const response = await request(app)
                .post('/api/url/shorten')
                .send({ longUrl: 'invalid-url' });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('success', false);
        });
    });

    describe('GET /:code', () => {
        test('should redirect to the original URL', async () => {
            // First create a URL
            await Url.create({
                urlCode: 'testcode',
                longUrl: 'https://example.com',
                shortUrl: 'http://localhost:5000/testcode',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days in the future
            });

            const response = await request(app).get('/testcode');
            expect(response.status).toBe(302); // Redirect status
        });

        test('should return 404 for non-existent URL code', async () => {
            const response = await request(app).get('/nonexistent');
            expect(response.status).toBe(404);  
        });
    });
});