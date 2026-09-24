const express = require("express");
const router = express.Router();
const { getStudents } = require("../controllers/studentsDetailsController");
const { verifyTeacher } = require("../middleware/auth");// now correctly a function

// GET all students for teacher's school/class/division
router.get("/students", verifyTeacher, getStudents);

module.exports = router;
