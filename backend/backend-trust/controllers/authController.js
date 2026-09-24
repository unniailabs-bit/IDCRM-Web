// backend-trust/controllers/authController.js
const { QueryTypes, Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sequelize = require('../../config/db');
const { sendOTPEmail } = require('../../utils/mailer');

// ---------------- Trust Login ----------------
const loginTrust = async (req, res) => {
  try {
    let { email, password } = req.body;

    // Trim inputs
    email = email?.trim();
    password = password?.trim();

    // ---- Validate inputs ----
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // ---- Fetch trust by email ----
    const trusts = await sequelize.query(
      `SELECT * FROM trusts WHERE email = :email`,
      { replacements: { email }, type: QueryTypes.SELECT }
    );

    const trust = trusts[0];

    if (!trust) {
      return res.status(404).json({ success: false, message: 'Trust account not found' });
    }

    if (!trust.password) {
      return res.status(400).json({ success: false, message: 'Password not set for this trust' });
    }

    // ---- Compare password ----
    const isMatch = await bcrypt.compare(password, trust.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // ---- Generate JWT token including trust details ----
    const tokenPayload = {
      id: trust.id,
      trust_id: trust.id,
      trust_name: trust.trust_name,
      email: trust.email,
      role: 'trust'
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '30d' }
    );

    // ---- Response ----
    res.status(200).json({
      success: true,
      message: '✅ Trust logged in successfully',
      token,
      trust: {
        id: trust.id,
        trust_name: trust.trust_name,
        email: trust.email,
        phone: trust.phone,
        address: trust.address
      }
    });
  } catch (err) {
    console.error('Trust Login Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ---------------- Trust Logout ----------------
const logoutTrust = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: '✅ Trust logged out successfully. Please clear your token from the client side.',
    });
  } catch (error) {
    console.error('Trust Logout Error:', error);
    res.status(500).json({ success: false, message: 'Server error during logout' });
  }
};

// ---------------- Trust Forgot Password ----------------
const forgotPassword = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ success: false, message: 'Request body is missing' });
    }
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const trusts = await sequelize.query(
      `SELECT * FROM trusts WHERE email = :email`,
      { replacements: { email }, type: QueryTypes.SELECT }
    );

    const trust = trusts[0];
    if (!trust) {
      return res.status(404).json({ success: false, message: 'Trust account not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await sequelize.query(
      `UPDATE trusts SET otp = :otp, otp_expires = :otpExpires, updated_at = NOW() WHERE email = :email`,
      { replacements: { otp, otpExpires, email }, type: QueryTypes.UPDATE }
    );

    await sendOTPEmail(email, otp);

    res.status(200).json({ success: true, message: 'OTP sent to your email' });
  } catch (err) {
    console.error('Trust Forgot Password Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ---------------- Trust Reset Password ----------------
const resetPassword = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ success: false, message: 'Request body is missing' });
    }
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const trusts = await sequelize.query(
      `SELECT * FROM trusts WHERE email = :email AND otp = :otp AND otp_expires > NOW()`,
      { replacements: { email, otp }, type: QueryTypes.SELECT }
    );

    const trust = trusts[0];
    if (!trust) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await sequelize.query(
      `UPDATE trusts SET password = :hashedPassword, otp = NULL, otp_expires = NULL, updated_at = NOW() WHERE email = :email`,
      { replacements: { hashedPassword, email }, type: QueryTypes.UPDATE }
    );

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('Trust Reset Password Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { loginTrust, logoutTrust, forgotPassword, resetPassword };
