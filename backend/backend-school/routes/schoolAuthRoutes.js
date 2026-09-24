const express = require('express');
const router = express.Router();
const { loginSchool, logoutSchool, forgotPassword, resetPassword } = require('../controllers/schoolAuthController');
const { loginLimiter } = require('../../middleware/rateLimiter');

router.post('/login', loginLimiter, loginSchool);
router.post('/logout', logoutSchool);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
