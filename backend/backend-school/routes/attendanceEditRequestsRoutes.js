const express = require("express");
const router = express.Router();
const { verifySchoolAdmin } = require("../middleware/authMiddleware");

const {
    getEditRequests,
    approveEditRequest,
    rejectEditRequest,
    bulkReviewRequests
} = require("../controllers/attendanceEditRequestsController");

// GET  all edit requests (filterable by status, division_id, month)
router.get("/", verifySchoolAdmin, getEditRequests);

// PATCH approve a single request
router.patch("/:id/approve", verifySchoolAdmin, approveEditRequest);

// PATCH reject a single request
router.patch("/:id/reject", verifySchoolAdmin, rejectEditRequest);

// POST bulk approve / reject
router.post("/bulk-review", verifySchoolAdmin, bulkReviewRequests);

module.exports = router;
