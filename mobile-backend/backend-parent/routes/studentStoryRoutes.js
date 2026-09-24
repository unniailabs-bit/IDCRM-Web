const express = require("express");
const router = express.Router();
const studentAuth = require("../middleware/studentAuth"); // middleware to get logged-in student
const { getStudentStories } = require("../controllers/studentStoryController");

// GET all stories relevant to logged-in student
router.get("/stories", studentAuth, getStudentStories);

module.exports = router;
