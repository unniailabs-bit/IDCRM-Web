const express = require('express');
const router = express.Router();
const { getAllSubjects, createSubject } = require('../controllers/subjectController');
const { verifyTrustAuth } = require('../middleware/trustAuthMiddleware');

// ---------------- Get All Subjects ----------------
router.get('/all', verifyTrustAuth, getAllSubjects);

// ---------------- Create New Subject ----------------
router.post('/create', verifyTrustAuth, createSubject);

module.exports = router;

