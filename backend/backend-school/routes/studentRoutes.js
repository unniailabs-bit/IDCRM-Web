const express = require('express');
const router = express.Router();
const { addStudent, getStudents } = require('../controllers/studentController');
const { verifySchoolAdmin } = require('../middleware/authMiddleware'); // Or verifySchoolAdmin later

// Add a new student
router.post('/create', verifySchoolAdmin, addStudent);

// Get all students of a school
router.get('/school/:school_id', verifySchoolAdmin, getStudents);

module.exports = router;
