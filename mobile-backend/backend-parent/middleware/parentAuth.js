const jwt = require("jsonwebtoken");
const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");

const parentAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const studentId = decoded.active_student_id || decoded.id;
    req.parentAccountId = decoded.parent_account_id || null;

    const parent = await sequelize.query(
      `SELECT * FROM student_forms WHERE id = :id`,
      {
        replacements: { id: studentId },
        type: QueryTypes.SELECT,
      },
    );

    if (!parent.length) {
      return res.status(401).json({ success: false, message: "Parent not found" });
    }

    const record = parent[0];
    if (record.password) delete record.password;
    req.parent = record;
    next();
  } catch (err) {
    console.error("Parent Auth Error:", err);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

module.exports = parentAuth;
