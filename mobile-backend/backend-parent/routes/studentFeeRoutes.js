const express = require("express");
const router = express.Router();
const parentAuth = require("../middleware/parentAuth");
const { getFeeDetails } = require("../controllers/studentFeeController");

// GET fee details for the student
router.get("/fees", parentAuth, getFeeDetails);

module.exports = router;
