const express = require('express');
const router = express.Router();
const {
  getAnalyticsOverview,
  getMonthlyTrends,
  getSchoolPerformance,
  getCreditDistribution,
  getIdCardStatus,
  getRecentActivity,
} = require('../controllers/analyticsController');
const { verifyTrustAuth } = require('../middleware/trustAuthMiddleware');

// ---------------- Analytics Routes ----------------
router.get('/overview', verifyTrustAuth, getAnalyticsOverview);
router.get('/monthly-trends', verifyTrustAuth, getMonthlyTrends);
router.get('/school-performance', verifyTrustAuth, getSchoolPerformance);
router.get('/credit-distribution', verifyTrustAuth, getCreditDistribution);
router.get('/id-card-status', verifyTrustAuth, getIdCardStatus);
router.get('/recent-activity', verifyTrustAuth, getRecentActivity);

module.exports = router;

