const express = require('express');
const router = express.Router();
const {
  getStudentEnrollmentReport,
  getFormSubmissionAnalytics,
  getIdCardGenerationReport,
  getTeacherPerformanceReport,
} = require('../controllers/schoolReportsController');
const { verifySchoolAdmin } = require('../middleware/authMiddleware');

// ---------------- School Reports Routes ----------------
router.get('/enrollment', verifySchoolAdmin, getStudentEnrollmentReport);
router.get('/form-analytics', verifySchoolAdmin, getFormSubmissionAnalytics);
router.get('/idcard-generation', verifySchoolAdmin, getIdCardGenerationReport);
router.get('/teacher-performance', verifySchoolAdmin, getTeacherPerformanceReport);

module.exports = router;

