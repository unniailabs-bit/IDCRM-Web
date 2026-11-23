const express = require('express');
const router = express.Router();
const { getAllSubjects, createSubject, updateSubject } = require('../controllers/subjectController');
const { verifyTrustAuth } = require('../middleware/trustAuthMiddleware');

// ---------------- Get All Subjects ----------------
router.get('/all', verifyTrustAuth, getAllSubjects);

// ---------------- Create New Subject ----------------
router.post('/create', verifyTrustAuth, createSubject);

// ---------------- Update Subject Name ----------------
router.patch('/:id', verifyTrustAuth, updateSubject);

module.exports = router;

