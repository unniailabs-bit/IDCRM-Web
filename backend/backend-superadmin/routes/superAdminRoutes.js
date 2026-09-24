const express = require('express');
const router = express.Router();
const { 
  createSuperAdmin, 
  loginSuperAdmin, 
  logoutSuperAdmin, 
  updateSuperAdminProfile,
  forgotPassword,
  resetPassword
} = require('../controllers/superAdminController');
const { loginLimiter } = require('../../middleware/rateLimiter');
const { verifySuperAdmin } = require('../middleware/authMiddleware');

// Create Super Admin
router.post('/create', createSuperAdmin);

// Super Admin Login
router.post('/login', loginLimiter, loginSuperAdmin);
router.post('/logout', logoutSuperAdmin);

// Update Profile
router.patch('/update-profile', verifySuperAdmin, updateSuperAdminProfile);

// Forgot & Reset Password
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
