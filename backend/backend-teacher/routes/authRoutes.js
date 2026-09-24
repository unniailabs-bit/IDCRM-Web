const express = require('express');
const router = express.Router();
const { loginTeacher, selectTeacherProfile, logoutTeacher, forgotPassword, resetPassword } = require('../controllers/authController');
const { loginLimiter } = require('../../middleware/rateLimiter');

// -------------------- Teacher Login --------------------
router.post('/login', loginLimiter, loginTeacher);
router.post('/select-profile', loginLimiter, selectTeacherProfile);

// -------------------- Teacher Logout --------------------
router.post('/logout', logoutTeacher);

// -------------------- Teacher Forgot & Reset Password --------------------
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
