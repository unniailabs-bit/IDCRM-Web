const express = require('express');
const router = express.Router();
const { getApprovedStudentsBySchool } = require('../controllers/publicStudentController');
const { publicApiLimiter } = require('../../middleware/rateLimiter');

// Public list of students (No auth required)
router.get('/list', publicApiLimiter, getApprovedStudentsBySchool);

module.exports = router;
