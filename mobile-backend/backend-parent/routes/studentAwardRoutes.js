const express = require('express');
const router = express.Router();
const studentAwardController = require('../controllers/studentAwardController');
const studentAuth = require('../middleware/studentAuth'); // or parentAuth if parent login

// ✅ Get logged-in student awards
// Example: GET /api/awards
router.get('/awards', studentAuth, studentAwardController.getStudentAwards);

module.exports = router;
