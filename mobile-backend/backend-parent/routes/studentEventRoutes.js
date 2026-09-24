const express = require("express");
const router = express.Router();

const parentAuth = require("../middleware/parentAuth");
const {
  getStudentEvents
} = require("../controllers/studentEventController");

// GET - Events for logged-in student
router.get("/events", parentAuth , getStudentEvents);

module.exports = router;
