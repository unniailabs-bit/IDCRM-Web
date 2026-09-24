const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware to verify School Admin token
const verifySchoolAdmin = (req, res, next) => {
  try {
    // Get token from Authorization header (check both lowercase and capitalized)
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    
    if (!authHeader) {
      console.error('Auth Middleware: No authorization header found');
      console.error('Available headers:', Object.keys(req.headers));
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    // Token format: "Bearer <token>"
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.error('Auth Middleware: Token missing from authorization header');
      return res.status(401).json({ success: false, message: 'Token missing' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if school_id exists in token
    if (!decoded.school_id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: School information not found in token.',
      });
    }

    // Attach user info to req
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      school_id: decoded.school_id, // ensure school_id is available for controllers
    };

    // Continue to next middleware/controller
    next();
  } catch (err) {
    console.error('JWT verification error:', err);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = { verifySchoolAdmin };
