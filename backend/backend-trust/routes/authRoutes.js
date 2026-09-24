const express = require('express');
const router = express.Router();
const { loginTrust, logoutTrust, forgotPassword, resetPassword } = require('../controllers/authController');
const { loginLimiter } = require('../../middleware/rateLimiter');

router.post('/login', loginLimiter, loginTrust);
router.post('/logout', logoutTrust);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
module.exports = router;
