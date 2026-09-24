const express = require("express");
const router = express.Router();
const teacherAuth = require("../middleware/authmiddleware");

const {
  getStudentsForAttendance,
  markAttendance,
  updateAttendance,
  getAttendanceStatus
} = require("../controllers/attendanceController");

// ==========================
// ATTENDANCE ROUTES
// ==========================

// GET approved students for attendance
router.get(
  "/attendance/students",
  teacherAuth,
  getStudentsForAttendance
);

// GET attendance status for specific date
router.get(
  "/attendance/status",
  teacherAuth,
  getAttendanceStatus
);

// POST mark attendance (bulk)
router.post(
  "/attendance/mark",
  teacherAuth,
  markAttendance
);
router.patch("/attendance/update", teacherAuth, updateAttendance);

module.exports = router;
