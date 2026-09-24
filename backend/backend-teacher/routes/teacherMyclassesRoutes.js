const express = require('express');
const router = express.Router();
const { getTeacherDashboard, getTeacherClassesList } = require('../controllers/teacherMyclassesController');
const { verifyTeacher } = require('../middleware/auth');

// Teacher dashboard route
router.get('/dashboard', verifyTeacher, getTeacherDashboard);

// Teacher's own classes list route
router.get('/my-classes', verifyTeacher, getTeacherClassesList);

module.exports = router;
