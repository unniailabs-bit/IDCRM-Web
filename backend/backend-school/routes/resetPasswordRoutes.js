const express = require('express');
const router = express.Router();
const { resetStudentPassword, searchStudentsByPhone } = require('../controllers/resetPasswordController');
const { verifySchoolAdmin } = require('../middleware/authMiddleware');

// GET  /api/school/search-students-by-phone?phone=9876543210
router.get('/search-students-by-phone', verifySchoolAdmin, searchStudentsByPhone);

// POST /api/school/reset-student-password
router.post('/reset-student-password', verifySchoolAdmin, resetStudentPassword);

module.exports = router;
