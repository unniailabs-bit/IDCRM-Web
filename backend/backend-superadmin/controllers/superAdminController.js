const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const SuperAdmin = require('../models/superAdminModel');
const { sendOTPEmail } = require('../../utils/mailer');

// ---------------- Create Super Admin ----------------
exports.createSuperAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'All fields are required' });
    }

    const existing = await SuperAdmin.findOne({ where: { email } });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: 'Super Admin already exists' });
    }

    const newAdmin = await SuperAdmin.create({ name, email, password });

    res.status(201).json({
      success: true,
      message: 'Super Admin created successfully',
      data: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
      },
    });
  } catch (error) {
    console.error('Error creating Super Admin:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ---------------- Super Admin Login ----------------
exports.loginSuperAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Email and password are required' });
    }

    const admin = await SuperAdmin.findOne({ where: { email } });

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: 'Super Admin not found' });
    }

    const isMatch = await admin.validPassword(password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'superadmin' },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
    });
  } catch (error) {
    console.error('Error logging in Super Admin:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ---------------- Super Admin Logout ----------------
exports.logoutSuperAdmin = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: '✅ Super Admin logged out successfully. Please clear your token from the client side.',
    });
  } catch (error) {
    console.error('Super Admin Logout Error:', error);
    res.status(500).json({ success: false, message: 'Server error during logout' });
  }
};

// ---------------- Update Super Admin Profile ----------------
exports.updateSuperAdminProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const adminId = req.user.id;

    const admin = await SuperAdmin.findByPk(adminId);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Super Admin not found' });
    }

    if (name) admin.name = name;

    if (email) {
      // Check if email is already taken by another admin
      const existing = await SuperAdmin.findOne({
        where: {
          email,
          id: { [Op.ne]: adminId },
        },
      });
      if (existing) {
        return res
          .status(400)
          .json({ success: false, message: 'Email already in use' });
      }
      admin.email = email;
    }

    if (password) {
      admin.password = password; // The model hook will hash this on save
    }

    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error('Error updating Super Admin profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ---------------- Super Admin Forgot Password ----------------
exports.forgotPassword = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ success: false, message: 'Request body is missing' });
    }
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const admin = await SuperAdmin.findOne({ where: { email } });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Super Admin not found' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    admin.otp = otp;
    admin.otpExpires = otpExpires;
    await admin.save();

    await sendOTPEmail(email, otp);

    res.status(200).json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Super Admin Forgot Password Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ---------------- Super Admin Reset Password ----------------
exports.resetPassword = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ success: false, message: 'Request body is missing' });
    }
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const admin = await SuperAdmin.findOne({
      where: {
        email,
        otp,
        otpExpires: { [Op.gt]: new Date() },
      },
    });

    if (!admin) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Update password (model hook will hash it)
    admin.password = newPassword;
    admin.otp = null;
    admin.otpExpires = null;
    await admin.save();

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Super Admin Reset Password Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
