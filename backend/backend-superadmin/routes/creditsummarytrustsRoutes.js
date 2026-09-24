const express = require("express");
const router = express.Router();
const { verifySuperAdmin } = require('../middleware/authMiddleware');
const { getAllTrustsCreditSummary } = require("../controllers/creditsummarytrustsControllers");

// GET credit summary for all trusts
router.get("/credit-summary-all", verifySuperAdmin, getAllTrustsCreditSummary);

module.exports = router;
