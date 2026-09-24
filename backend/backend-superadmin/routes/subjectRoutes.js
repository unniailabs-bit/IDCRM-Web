const express = require('express');
const router = express.Router();
const { getAllSubjects, createSubject } = require('../controllers/subjectController');
const { verifySuperAdmin } = require('../middleware/authMiddleware');

// ---------------- Get All Subjects (Super Admin) ----------------
router.get('/all', verifySuperAdmin, getAllSubjects);

// ---------------- Create New Subject (Super Admin) ----------------
router.post('/create', verifySuperAdmin, createSubject);

module.exports = router;

