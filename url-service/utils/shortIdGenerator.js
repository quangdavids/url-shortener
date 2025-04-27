const { nanoid } = require('nanoid');

/**
 * Generates a short, unique ID for URL shortening
 * @param {number} size - The size of the ID (default: 7)
 * @returns {string} - The generated ID
 */
const generateShortId = (size = 7) => {
    return nanoid(size);
};

module.exports = { generateShortId };