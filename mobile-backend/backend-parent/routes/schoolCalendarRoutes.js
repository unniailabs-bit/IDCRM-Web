const express = require("express");
const router = express.Router();
const schoolCalendarController = require("../controllers/schoolCalendarController");
const parentAuth = require("../middleware/parentAuth");

// GET /api/parent/calendar
router.get("/calendar", parentAuth, schoolCalendarController.getSchoolCalendar);

module.exports = router;
