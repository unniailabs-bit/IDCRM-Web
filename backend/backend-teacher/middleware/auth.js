const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyTeacher = (req, res, next) => {
  try {
    // Get token from Authorization header (case-insensitive check)
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No token provided in Authorization header'
      });
    }

    // Authorization: Bearer <token>
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token missing in Authorization header'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

    if (decoded.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Not a teacher'
      });
    }

    // Attach user info from JWT to req.user
    req.user = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,           // optional, if included in JWT
      role: decoded.role,
      school_id: decoded.school_id || null,
      class_id: decoded.class_id || null,
      division_id: decoded.division_id || null
    };

    next(); // ✅ pass control to next middleware or route handler
  } catch (err) {
    console.error('JWT verification error:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

module.exports = { verifyTeacher };
