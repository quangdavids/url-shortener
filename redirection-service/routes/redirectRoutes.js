
const express = require('express');
const redirectController = require('../controllers/redirectController');
const router = express.Router();
const { cacheMiddleware } = require('../../url-service/middlewares/cache');

router.get('/:code', cacheMiddleware, redirectController.redirectUrl);

module.exports = router;