const express = require('express');
const router = express.Router();
const { getApprovedStudentsBySchool, getStudentByFormId } = require('../controllers/publicStudentController');
const { publicApiLimiter } = require('../../middleware/rateLimiter');

// Public list of students (No auth required)
router.get('/list', publicApiLimiter, getApprovedStudentsBySchool);

// Public single student by ID – used when QR code is scanned (No auth required)
router.get('/:id', publicApiLimiter, getStudentByFormId);

module.exports = router;
