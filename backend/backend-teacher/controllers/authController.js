const { QueryTypes } = require('sequelize');
const sequelize = require('../../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../../utils/mailer');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function passwordMatches(password, storedPassword) {
  if (!storedPassword) return false;
  if (String(storedPassword).startsWith('$2')) {
    return bcrypt.compare(password, storedPassword);
  }
  return password === storedPassword;
}

function issueSelectionToken(payload) {
  return jwt.sign(
    { ...payload, purpose: 'profile_selection' },
    process.env.JWT_SECRET || 'secretkey',
    { expiresIn: '10m' }
  );
}

function verifySelectionToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
  if (decoded.purpose !== 'profile_selection') {
    throw new Error('Invalid selection token');
  }
  return decoded;
}

async function findMatchingTeachers(email, password) {
  const teachers = await sequelize.query(
    `SELECT t.*, s.school_name, s.logo AS school_logo
     FROM teachers t
     LEFT JOIN schools s ON t.school_id = s.id
     WHERE LOWER(t.email) = :email
       AND t.status = 'Active'
     ORDER BY t.id ASC`,
    { replacements: { email: normalizeEmail(email) }, type: QueryTypes.SELECT }
  );

  if (teachers.length === 0) {
    return { matched: [], emailFound: false };
  }

  const matched = [];
  for (const teacher of teachers) {
    if (await passwordMatches(password, teacher.password)) {
      matched.push(teacher);
    }
  }
  return { matched, emailFound: true };
}

async function getTeacherWithDivision(teacherId) {
  const [teacher] = await sequelize.query(
    `SELECT t.id, t.name, t.email, t.school_id, t.subject, t.profile_pic,
            s.school_name, s.logo AS school_logo,
            d.class_id, d.id AS division_id
     FROM teachers t
     LEFT JOIN schools s ON t.school_id = s.id
     LEFT JOIN divisions d ON d.teacher_id = t.id
     WHERE t.id = :id AND t.status = 'Active'
     LIMIT 1`,
    { replacements: { id: teacherId }, type: QueryTypes.SELECT }
  );
  return teacher || null;
}

function mapTeacherOption(teacher) {
  return {
    teacher_id: Number(teacher.id),
    name: teacher.name,
    email: teacher.email,
    subject: teacher.subject,
    school_id: Number(teacher.school_id),
    school_name: teacher.school_name,
    school_logo: teacher.school_logo,
    profile_pic: teacher.profile_pic,
  };
}

function buildTeacherLoginResponse(teacher) {
  const token = jwt.sign(
    {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      role: 'teacher',
      school_id: teacher.school_id,
      class_id: teacher.class_id,
      division_id: teacher.division_id,
    },
    process.env.JWT_SECRET || 'secretkey',
    { expiresIn: '30d' }
  );

  return {
    success: true,
    message: 'Teacher logged in successfully.',
    requires_selection: false,
    token,
    teacher: {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      school_id: teacher.school_id,
      school_name: teacher.school_name,
      class_id: teacher.class_id,
      division_id: teacher.division_id,
    },
  };
}

function completeTeacherLogin(res, teacher) {
  return res.status(200).json(buildTeacherLoginResponse(teacher));
}

// -------------------- Teacher Login --------------------
const loginTeacher = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const { matched: matchedTeachers, emailFound } = await findMatchingTeachers(email, password);
    if (!emailFound) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found.',
      });
    }

    if (matchedTeachers.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    if (matchedTeachers.length > 1) {
      return res.status(200).json({
        success: true,
        requires_selection: true,
        selection_type: 'teacher_school',
        message: 'Select the school you want to sign in to',
        selection_token: issueSelectionToken({
          selection_type: 'teacher_school',
          email: normalizeEmail(email),
          teacher_ids: matchedTeachers.map((t) => Number(t.id)),
        }),
        options: matchedTeachers.map(mapTeacherOption),
      });
    }

    const teacher = await getTeacherWithDivision(matchedTeachers[0].id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found.',
      });
    }

    return completeTeacherLogin(res, teacher);
  } catch (error) {
    console.error('Teacher Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during teacher login.',
    });
  }
};

// -------------------- Teacher School Selection --------------------
const selectTeacherProfile = async (req, res) => {
  try {
    const { selection_token, selection_type, teacher_id } = req.body;

    if (!selection_token || !selection_type) {
      return res.status(400).json({
        success: false,
        message: 'selection_token and selection_type are required',
      });
    }

    const decoded = verifySelectionToken(selection_token);
    if (decoded.selection_type !== selection_type) {
      return res.status(400).json({
        success: false,
        message: 'Selection type mismatch',
      });
    }

    if (selection_type !== 'teacher_school') {
      return res.status(400).json({
        success: false,
        message: 'Unsupported selection type',
      });
    }

    const teacherId = Number(teacher_id);
    if (!teacherId || !decoded.teacher_ids?.includes(teacherId)) {
      return res.status(403).json({
        success: false,
        message: 'Invalid teacher selection',
      });
    }

    const teacher = await getTeacherWithDivision(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    return completeTeacherLogin(res, teacher);
  } catch (error) {
    console.error('Teacher Select Profile Error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Selection expired. Please login again.',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error during profile selection.',
    });
  }
};

// -------------------- Teacher Logout --------------------
const logoutTeacher = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Teacher logged out successfully. Please clear your token on client side.',
    });
  } catch (error) {
    console.error('Teacher Logout Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout.',
    });
  }
};

// -------------------- Teacher Forgot Password --------------------
const forgotPassword = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ success: false, message: 'Request body is missing' });
    }
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const teachers = await sequelize.query(
      `SELECT * FROM teachers WHERE LOWER(email) = LOWER(:email)`,
      { replacements: { email }, type: QueryTypes.SELECT }
    );

    const teacher = teachers[0];
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher account not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await sequelize.query(
      `UPDATE teachers SET otp = :otp, otp_expires = :otpExpires, updated_at = NOW() WHERE email = :email`,
      { replacements: { otp, otpExpires, email: teacher.email }, type: QueryTypes.UPDATE }
    );

    await sendOTPEmail(teacher.email, otp);

    res.status(200).json({ success: true, message: 'OTP sent to your email' });
  } catch (err) {
    console.error('Teacher Forgot Password Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// -------------------- Teacher Reset Password --------------------
const resetPassword = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ success: false, message: 'Request body is missing' });
    }
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const teachers = await sequelize.query(
      `SELECT * FROM teachers WHERE LOWER(email) = LOWER(:email) AND otp = :otp AND otp_expires > NOW()`,
      { replacements: { email, otp }, type: QueryTypes.SELECT }
    );

    const teacher = teachers[0];
    if (!teacher) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await sequelize.query(
      `UPDATE teachers SET password = :hashedPassword, otp = NULL, otp_expires = NULL, updated_at = NOW() WHERE email = :email`,
      { replacements: { hashedPassword, email: teacher.email }, type: QueryTypes.UPDATE }
    );

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('Teacher Reset Password Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  loginTeacher,
  selectTeacherProfile,
  logoutTeacher,
  forgotPassword,
  resetPassword,
};
