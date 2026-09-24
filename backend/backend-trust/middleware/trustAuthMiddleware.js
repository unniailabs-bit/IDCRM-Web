const jwt = require('jsonwebtoken');
const sequelize = require('../../config/db');
const { QueryTypes } = require('sequelize');

const verifyTrustAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header (format: "Bearer <token>") - case-insensitive check
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Access denied: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied: Invalid token format' });
    }

    // Verify JWT - Use same fallback as token creation
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    req.user = decoded;

    // Check if trust exists in DB
    const trust = await sequelize.query(
      `SELECT * FROM trusts WHERE id = :id`,
      { replacements: { id: decoded.id }, type: QueryTypes.SELECT }
    );

    if (!trust || trust.length === 0) {
      return res.status(403).json({ success: false, message: 'Invalid or unauthorized trust account' });
    }

    // Proceed to next middleware/controller
    next();

  } catch (err) {
    console.error('Trust Auth Error:', err.message);
    res.status(401).json({ success: false, message: 'Unauthorized: Invalid or expired token' });
  }
};

module.exports = { verifyTrustAuth };
