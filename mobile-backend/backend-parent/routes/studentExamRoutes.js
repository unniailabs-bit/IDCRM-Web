const express = require("express");
const router = express.Router();
const studentAuth = require("../middleware/studentAuth");
const studentExamController = require("../controllers/studentExamController");

// GET all exams for student
router.get("/student/exams", studentAuth, studentExamController.getStudentExams);

// GET single exam with schedule
router.get("/student/exams/:id", studentAuth, studentExamController.getStudentExamById);

module.exports = router;
