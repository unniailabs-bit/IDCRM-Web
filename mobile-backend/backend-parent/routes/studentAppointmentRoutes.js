const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/studentAppointmentController.js");
const parentAuth = require("../middleware/parentAuth");

// GET /api/parent/appointments
// Returns appointments for the student's specific schoolId
router.get("/", parentAuth, appointmentController.getAppointments);

module.exports = router;
