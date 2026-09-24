const express = require("express");
const router = express.Router();

const { getMcqsForStudent } = require("../controllers/mcqparentController");
const studentAuth = require("../middleware/studentAuth"); // middleware to check JWT

// 🔐 Student protected route
router.get("/mcqs", studentAuth, getMcqsForStudent);

module.exports = router;
