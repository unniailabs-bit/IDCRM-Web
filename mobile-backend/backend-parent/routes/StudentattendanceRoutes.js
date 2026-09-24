const express = require("express");
const router = express.Router();
const { getStudentAttendance } = require("../controllers/StudentattendanceController");
const studentAuth = require("../middleware/studentAuth"); // JWT auth for students/parents


router.get("/student", studentAuth, getStudentAttendance);

module.exports = router;
