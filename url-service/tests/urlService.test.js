const { isValidUrl } = require('../utils/validator');
const { generateShortId } = require('../utils/shortIdGenerator');

// Mocking dependencies
jest.mock('../models/Url');
jest.mock('../middlewares/cache');
jest.mock('../utils/shortIdGenerator');

describe('URL Validator', () => {
    test('should return true for valid URLs', () => {
        expect(isValidUrl('https://example.com')).toBe(true);
        expect(isValidUrl('http://example.com')).toBe(true);
        expect(isValidUrl('https://www.example.com/path?query=string#hash')).toBe(true);
    });

    test('should return false for invalid URLs', () => {
        expect(isValidUrl('example.com')).toBe(false);
        expect(isValidUrl('not a url')).toBe(false);
        expect(isValidUrl('')).toBe(false);
    });
});

describe('Short ID Generator', () => {
    test('should generate a string of specified length', () => {
        // Mock generateShortId to return a predictable value
        const mockShortId = 'abc1234';
        generateShortId.mockReturnValue(mockShortId);
        
        const result = generateShortId(7);
        expect(result).toBe(mockShortId);
        expect(result.length).toBe(7);
    });
});