const validUrl = require('valid-url');

/**
 * Validates if the provided URL is valid
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidUrl = (url) => {
    return validUrl.isWebUri(url) ? true : false;
};

module.exports = { isValidUrl };