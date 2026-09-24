const express = require('express');
const router = express.Router();
const { getSchoolProfile, updateSchoolProfile, changePassword } = require('../controllers/schoolSettingsController');
const { verifySchoolAdmin } = require('../middleware/authMiddleware');

// ---------------- School Settings Routes ----------------
router.get('/profile', verifySchoolAdmin, getSchoolProfile);
router.patch('/profile', verifySchoolAdmin, updateSchoolProfile);
router.post('/change-password', verifySchoolAdmin, changePassword);

module.exports = router;

