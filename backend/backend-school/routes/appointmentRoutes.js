const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

// ---------------- Appointment Routes ----------------
// Add Appointment
router.post('/', appointmentController.addAppointment);
// Get Appointments for School
router.get('/:school_id', appointmentController.getAppointments);

// Update Appointment
router.patch('/:appointment_id', appointmentController.updateAppointment);

// Delete Appointment
router.delete('/:appointment_id', appointmentController.deleteAppointment);

module.exports = router;
