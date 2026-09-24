const express = require("express");
const router = express.Router();
const teacherAuth = require("../middleware/authmiddleware");

const {
  getAttendanceSummary
} = require("../controllers/attendanceSummaryController");

// ==========================
// ATTENDANCE SUMMARY ROUTE
// ==========================
router.get(
  "/attendance/summary",
  teacherAuth,
  getAttendanceSummary
);

module.exports = router;
