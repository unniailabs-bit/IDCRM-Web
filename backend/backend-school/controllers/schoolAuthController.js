const { QueryTypes } = require('sequelize');
const sequelize = require('../../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../../utils/mailer');

// ---------------- School Login ----------------
const loginSchool = async (req, res) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/44e11d4c-cdfa-490a-8592-2061398e4056',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      location:'schoolAuthController.js:7',
      message:'loginSchool entry',
      data:{
        hasBody:!!req.body,
        email:req.body?.email?'present':'missing',
        password:req.body?.password?'present':'missing'
      },
      timestamp:Date.now(),
      sessionId:'debug-session',
      runId:'run1',
      hypothesisId:'D'
    })
  }).catch(()=>{});
  // #endregion

  try {
    const { email, password } = req.body;

    // --- Validation ---
    if (!email || !password) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/44e11d4c-cdfa-490a-8592-2061398e4056',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          location:'schoolAuthController.js:12',
          message:'validation failed',
          data:{ hasEmail:!!email, hasPassword:!!password },
          timestamp:Date.now(),
          sessionId:'debug-session',
          runId:'run1',
          hypothesisId:'D'
        })
      }).catch(()=>{});
      // #endregion

      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // --- Find School by Email (Trust Name + Address Added) ---
    const schoolQuery = `
      SELECT 
        s.id,
        s.school_name,
        s.email,
        s.password,
        s.address,
        t.trust_name
      FROM schools s
      LEFT JOIN trusts t ON t.id = s.trust_id
      WHERE LOWER(s.email) = LOWER(:email)
      LIMIT 1;
    `;

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/44e11d4c-cdfa-490a-8592-2061398e4056',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        location:'schoolAuthController.js:26',
        message:'before db query',
        data:{
          email,
          dbConnected:!!sequelize,
          hasSequelize:typeof sequelize !== 'undefined'
        },
        timestamp:Date.now(),
        sessionId:'debug-session',
        runId:'run1',
        hypothesisId:'A'
      })
    }).catch(()=>{});
    // #endregion

    const schools = await sequelize.query(schoolQuery, {
      replacements: { email },
      type: QueryTypes.SELECT,
    });

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/44e11d4c-cdfa-490a-8592-2061398e4056',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        location:'schoolAuthController.js:30',
        message:'after db query',
        data:{
          schoolsFound:schools.length,
          firstSchoolId:schools[0]?.id
        },
        timestamp:Date.now(),
        sessionId:'debug-session',
        runId:'run1',
        hypothesisId:'B'
      })
    }).catch(()=>{});
    // #endregion

    if (!schools.length) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    const school = schools[0];

    // --- Check Password ---
    if (!school.password) {
      console.error('School found but password is null or empty:', school.email);
      return res.status(500).json({
        success: false,
        message: 'School account is not properly configured. Please contact administrator.',
      });
    }

    const isMatch = await bcrypt.compare(password, school.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // --- Generate JWT Token ---
    const tokenPayload = {
      id: school.id,
      email: school.email,
      school_id: school.id,
      role: 'school',
    };

    const jwtSecret = process.env.JWT_SECRET || 'defaultSecretKey';

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/44e11d4c-cdfa-490a-8592-2061398e4056',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        location:'schoolAuthController.js:65',
        message:'before jwt sign',
        data:{
          hasJwtSecret:!!process.env.JWT_SECRET,
          usingDefault:!process.env.JWT_SECRET
        },
        timestamp:Date.now(),
        sessionId:'debug-session',
        runId:'run1',
        hypothesisId:'C'
      })
    }).catch(()=>{});
    // #endregion

    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '30d' });

    // --- Response (Trust Name + Address Added) ---
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        id: school.id,
        name: school.school_name,
        email: school.email,
        trust_name: school.trust_name || null,
        address: school.address || null,
      },
    });

  } catch (err) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/44e11d4c-cdfa-490a-8592-2061398e4056',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        location:'schoolAuthController.js:82',
        message:'loginSchool error',
        data:{
          errorMessage:err.message,
          errorName:err.name,
          hasStack:!!err.stack,
          isDatabaseError:
            err.message?.includes('connect') ||
            err.message?.includes('ECONNREFUSED') ||
            err.message?.includes('relation')
        },
        timestamp:Date.now(),
        sessionId:'debug-session',
        runId:'run1',
        hypothesisId:'A,E'
      })
    }).catch(()=>{});
    // #endregion

    console.error('Login School Error:', err);
    console.error('Error Stack:', err.stack);

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ---------------- School Logout ----------------
const logoutSchool = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: '✅ School logged out successfully. Please clear your token from the client side.',
    });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

// ---------------- School Forgot Password ----------------
const forgotPassword = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ success: false, message: 'Request body is missing' });
    }
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const schools = await sequelize.query(
      `SELECT * FROM schools WHERE LOWER(email) = LOWER(:email)`,
      { replacements: { email }, type: QueryTypes.SELECT }
    );

    const school = schools[0];
    if (!school) {
      return res.status(404).json({ success: false, message: 'School account not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await sequelize.query(
      `UPDATE schools SET otp = :otp, otp_expires = :otpExpires, updated_at = NOW() WHERE email = :email`,
      { replacements: { otp, otpExpires, email }, type: QueryTypes.UPDATE }
    );

    await sendOTPEmail(email, otp);

    res.status(200).json({ success: true, message: 'OTP sent to your email' });
  } catch (err) {
    console.error('School Forgot Password Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ---------------- School Reset Password ----------------
const resetPassword = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ success: false, message: 'Request body is missing' });
    }
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const schools = await sequelize.query(
      `SELECT * FROM schools WHERE LOWER(email) = LOWER(:email) AND otp = :otp AND otp_expires > NOW()`,
      { replacements: { email, otp }, type: QueryTypes.SELECT }
    );

    const school = schools[0];
    if (!school) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await sequelize.query(
      `UPDATE schools SET password = :hashedPassword, otp = NULL, otp_expires = NULL, updated_at = NOW() WHERE email = :email`,
      { replacements: { hashedPassword, email }, type: QueryTypes.UPDATE }
    );

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('School Reset Password Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { loginSchool, logoutSchool, forgotPassword, resetPassword };
