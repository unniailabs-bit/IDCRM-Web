const express = require("express");
const router = express.Router();

// 🔐 Auth middleware
const { verifyTrustAuth } = require("../middleware/trustAuthMiddleware");


// 🎯 Controller
const { getTrustGeneratedIdsSummary } = require("../controllers/trustGeneratedIdsController");

// GET /trust/generated-ids-summary
router.get("/generated-ids-summary", verifyTrustAuth, getTrustGeneratedIdsSummary);

module.exports = router;
