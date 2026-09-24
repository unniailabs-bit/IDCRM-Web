const express = require("express");
const { getPendingApprovalSummary } = require("../controllers/teacherPendingApprovalController");
const { verifyTeacher } = require("../middleware/auth");

const router = express.Router();

// GET pending/approval summary
router.get("/pending-summary", verifyTeacher, getPendingApprovalSummary);

module.exports = router;
