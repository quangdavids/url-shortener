import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Transform URL data from the API to the client format
 * @param {Object} urlData - URL data from the API
 * @returns {Object} Transformed URL data for client use
 */
export const transformUrlData = (urlData) => {
  return {
    id: urlData._id || Date.now().toString(), // Fallback if _id isn't available
    urlCode: urlData.urlCode,
    longUrl: urlData.longUrl,
    shortUrl: `${window.location.origin}/${urlData.urlCode}`,
    clicks: urlData.clicks || 0,
    createdAt: urlData.createdAt,
    expiresAt: urlData.expiresAt,
    copied: false
  };
};

/**
 * Store URLs in local storage as backup
 * @param {Array} urls - Array of URL objects to store
 */
export const storeUrlsLocally = (urls) => {
  localStorage.setItem('shortUrls', JSON.stringify(urls));
};

/**
 * Retrieve URLs from local storage
 * @returns {Array|null} Array of URL objects or null if not found
 */
export const getUrlsFromStorage = () => {
  const savedUrls = localStorage.getItem('shortUrls');
  return savedUrls ? JSON.parse(savedUrls) : null;
};

export const urlService = {
  /**
   * Fetch all URLs for the current user
   * @returns {Promise} Response with all URLs
   */
  getAllUrls: async () => {
    return api.get('/api/url/all');
  },

  /**
   * Shorten a URL
   * @param {Object} urlData - URL data to be shortened
   * @param {string} urlData.longUrl - The long URL to shorten
   * @param {boolean} urlData.trackClicks - Whether to track clicks
   * @param {string} [urlData.customCode] - Optional custom code for the shortened URL
   * @param {number} [urlData.expiryDays] - Optional expiry days
   * @returns {Promise} Response with the shortened URL data
   */
  shortenUrl: async (urlData) => {
    return api.post('/api/url/shorten', urlData);
  },

  /**
   * Delete a URL by its code
   * @param {string} urlCode - The code of the URL to delete
   * @returns {Promise} Response with deletion status
   */
  deleteUrl: async (urlCode) => {
    return api.delete(`/api/url/${urlCode}`);
  },

  /**
   * Get analytics for a specific URL
   * @param {string} urlCode - The code of the URL to get analytics for
   * @returns {Promise} Response with URL analytics data
   */
  getUrlAnalytics: async (urlCode) => {
    return api.get(`/api/url/analytics/${urlCode}`);
  }
};

export const redirectService = {
  /**
   * Get long URL for redirect using a short URL code
   * @param {string} code - The code of the short URL
   * @returns {Promise} Response with the long URL for redirection
   */
    baseURL: 'http://localhost:3000',
  getRedirectUrl: async (code) => {
    // Create a special instance for redirect requests with Accept header
    const redirectApi = axios.create({
      baseURL: 'http://localhost:3000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'  // Important: Tell backend this is an API request
      },
    });

    return redirectApi.get(`/api/redirect/${code}`);
  }
};

export default {
  urlService,
  redirectService,
  transformUrlData,
  storeUrlsLocally,
  getUrlsFromStorage,
};
