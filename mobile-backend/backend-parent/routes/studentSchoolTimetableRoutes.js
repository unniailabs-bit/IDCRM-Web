const express = require("express");
const router = express.Router();
const studentAuth = require("../middleware/studentAuth");
const studentSchoolTimetableController = require("../controllers/studentSchoolTimetableController");

// GET school timetable for student
router.get("/school-timetable", studentAuth, studentSchoolTimetableController.getStudentSchoolTimetable);

module.exports = router;
