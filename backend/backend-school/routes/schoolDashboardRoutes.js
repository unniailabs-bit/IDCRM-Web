const express = require('express');
const router = express.Router();
const {
  getSchoolDashboardOverview,
  getClasswiseIdStatus,
  getQuickStats,
  getRecentActivity,
} = require('../controllers/schoolDashboardController');
const { verifySchoolAdmin } = require('../middleware/authMiddleware');

// ---------------- School Dashboard Routes ----------------
router.get('/overview', verifySchoolAdmin, getSchoolDashboardOverview);
router.get('/classwise-id-status', verifySchoolAdmin, getClasswiseIdStatus);
router.get('/quick-stats', verifySchoolAdmin, getQuickStats);
router.get('/recent-activity', verifySchoolAdmin, getRecentActivity);

module.exports = router;

