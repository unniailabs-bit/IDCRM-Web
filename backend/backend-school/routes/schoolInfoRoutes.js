const express = require('express');
const router = express.Router();
const { getSchoolPublicInfo } = require('../controllers/schoolInfoController');
const { publicApiLimiter } = require('../../middleware/rateLimiter');

// Get Public School Info (No Authentication Required)
router.get('/public/:id', publicApiLimiter, getSchoolPublicInfo);

module.exports = router;
