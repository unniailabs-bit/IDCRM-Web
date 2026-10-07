const express = require("express");
const router = express.Router();
const { verifyTeacher } = require("../middleware/auth");

const {
    getTeacherClasses,
    getStudentsForAttendance,
    getAttendanceStatus,
    getAttendanceRegister,
    markAttendance,
    updateAttendance,
    getTeacherEditRequests
} = require("../controllers/attendanceController");

// ==========================
// TEACHER ATTENDANCE ROUTES
// ==========================

// GET teacher assigned classes / divisions
router.get("/classes", verifyTeacher, getTeacherClasses);

// GET approved students for attendance
router.get("/students", verifyTeacher, getStudentsForAttendance);

// GET attendance status for specific single date
router.get("/status", verifyTeacher, getAttendanceStatus);

// GET monthly attendance register matrix
router.get("/register", verifyTeacher, getAttendanceRegister);

// POST mark / bulk update attendance for a date
router.post("/mark", verifyTeacher, markAttendance);

// PATCH update single student attendance
router.patch("/update", verifyTeacher, updateAttendance);

// GET teacher's own attendance edit requests (pending/approved/rejected)
router.get("/edit-requests", verifyTeacher, getTeacherEditRequests);

module.exports = router;
