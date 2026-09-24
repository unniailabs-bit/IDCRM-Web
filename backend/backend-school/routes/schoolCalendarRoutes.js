const express = require('express');
const router = express.Router();
const {
    createCalendarEvent,
    getCalendarEvents,
    updateCalendarEvent,
    deleteCalendarEvent,
    deleteCalendarEventsByRange
} = require('../controllers/schoolCalendarController');
const { verifySchoolAdmin } = require('../middleware/authMiddleware');

// Create Calendar Event (Single or Multiple)
router.post('/create', verifySchoolAdmin, createCalendarEvent);

// Get Calendar Events (with optional filters: type, month, year, is_active)
router.get('/', verifySchoolAdmin, getCalendarEvents);

// Delete Calendar Events by Range [NEW]
router.delete('/delete-range', verifySchoolAdmin, deleteCalendarEventsByRange);

// Update Calendar Event
router.patch('/:id', verifySchoolAdmin, updateCalendarEvent);

// Delete Calendar Event
router.delete('/:id', verifySchoolAdmin, deleteCalendarEvent);

module.exports = router;
