
const express = require("express");
const router = express.Router();
const { getTrustCreditSummary } = require("../controllers/trustCreditSummaryController");
const { verifyTrustAuth } = require('../middleware/trustAuthMiddleware');

router.get("/credit-summary", verifyTrustAuth , getTrustCreditSummary);

module.exports = router;
