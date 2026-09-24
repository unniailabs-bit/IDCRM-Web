const express = require("express");
const router = express.Router();

const studentAuth = require("../middleware/studentAuth");
const {
  startPractice,
  submitPractice,
  getPracticeHistory,
  getMaterialWiseMcqs
} = require("../controllers/studentMcqPracticeController");

// Start MCQ practice
router.post("/mcq/practice/start", studentAuth, startPractice);

// Submit MCQ practice
router.post("/mcq/practice/submit", studentAuth, submitPractice);

// Get practice history
router.get("/mcq/practice/history", studentAuth, getPracticeHistory);

// Get MCQs grouped by material
router.get("/mcq/material-wise", studentAuth, getMaterialWiseMcqs);

module.exports = router;
