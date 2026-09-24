const jwt = require("jsonwebtoken");
const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const studentId = decoded.active_student_id || decoded.id;
    req.parentAccountId = decoded.parent_account_id || null;

    const students = await sequelize.query(
      `SELECT * FROM student_forms WHERE id = :id`,
      {
        replacements: { id: studentId },
        type: QueryTypes.SELECT,
      },
    );

    if (students.length === 0) {
      return res.status(401).json({ success: false, message: "Student record not found" });
    }

    const record = students[0];
    if (record.password) delete record.password;
    req.student = record;
    req.parent = record;
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Student Auth Error:", err);
    return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
  }
};
