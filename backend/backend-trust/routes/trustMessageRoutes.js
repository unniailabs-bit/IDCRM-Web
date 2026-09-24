// backend-trust/routes/trustMessageRoutes.js
const express = require("express");
const router = express.Router();

const { sendMessage, getTrustMessages } = require("../controllers/trustMessageController");
const { verifyTrustAuth } = require("../middleware/trustAuthMiddleware");

// POST message from trust
router.post("/trust/:trust_id/message", verifyTrustAuth, sendMessage);

// GET messages for the trust
router.get("/trust/:trust_id/messages", verifyTrustAuth, getTrustMessages);

module.exports = router;
