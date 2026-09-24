const express = require("express");
const router = express.Router();
const teacherAuth = require("../middleware/authmiddleware");
const schoolCalendarController = require("../controllers/schoolCalendarController");

// -----------------------------
// Get School Calendar
// -----------------------------
router.get("/calendar", teacherAuth, schoolCalendarController.getSchoolCalendar);

module.exports = router;
