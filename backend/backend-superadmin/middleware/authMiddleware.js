const jwt = require('jsonwebtoken');
require('dotenv').config();

// ---------------- Super Admin Token Verification Middleware ----------------
const verifySuperAdmin = (req, res, next) => {
  try {
    // 1️⃣ Get token from Authorization header (case-insensitive check)
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Authorization header missing' });
    }

    // 2️⃣ Token format: "Bearer <token>"
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token missing from header' });
    }

    // 3️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

    // 4️⃣ Attach decoded user info to request
    req.user = decoded; // contains id, role, email, etc.

    // 5️⃣ Continue to next middleware or route handler
    next();
  } catch (err) {
    console.error('JWT verification error:', err);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }
};

module.exports = { verifySuperAdmin };
