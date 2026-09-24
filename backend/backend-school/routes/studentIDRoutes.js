// // backend-school/routes/studentIDRoutes.js
// const express = require("express");
// const router = express.Router();
// const { generateStudentIDs } = require("../controllers/studentIDController");
// const { verifySchoolAdmin } = require("../middleware/authMiddleware");

// // ✅ POST: generate IDs for approved students
// router.post("/generate-ids", verifySchoolAdmin, generateStudentIDs);

// // Optional GET: fetch students without generated IDs
// router.get("/pending-ids", verifySchoolAdmin, async (req, res) => {
//   try {
//     const sequelize = require("../../config/db"); // Import here
//     const { QueryTypes } = require("sequelize");
//     const schoolId = parseInt(req.user?.school_id, 10);

//     const students = await sequelize.query(
//       `SELECT sf.id AS student_form_id, sf.roll_number, sf.first_name || ' ' || sf.last_name AS student_name
//        FROM student_forms sf
//        LEFT JOIN student_generated_ids sg
//          ON sf.id = sg.student_form_id
//        WHERE sf.school_id = :schoolId
//          AND LOWER(sf.status) = 'approved'
//          AND sg.student_form_id IS NULL
//        ORDER BY sf.class_id, sf.roll_number`,
//       { replacements: { schoolId }, type: QueryTypes.SELECT }
//     );

//     res.json({ success: true, data: students });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// module.exports = router;
// backend-school/routes/studentIDRoutes.js

const express = require("express");
const router = express.Router();
const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");

const { generateStudentIDs } = require("../controllers/studentIDController");
const { verifySchoolAdmin } = require("../middleware/authMiddleware");

// ✅ POST: generate IDs for approved students
router.post("/generate-ids", verifySchoolAdmin, generateStudentIDs);

// ✅ GET: fetch approved students who DON'T have generated IDs
router.get("/pending-ids", verifySchoolAdmin, async (req, res) => {
  try {
    const schoolId = parseInt(req.user?.school_id, 10);

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID missing",
      });
    }

    const students = await sequelize.query(
      `SELECT 
          sf.id AS student_form_id, 
          sf.roll_number, 
          sf.first_name || ' ' || sf.last_name AS student_name
       FROM student_forms sf
       LEFT JOIN student_generated_ids sg
         ON sf.id = sg.student_form_id
       WHERE sf.school_id = :schoolId
         AND LOWER(TRIM(sf.status)) = 'approved'
         AND sg.student_form_id IS NULL
       ORDER BY sf.class_id, sf.roll_number`,
      {
        replacements: { schoolId },
        type: QueryTypes.SELECT,
      }
    );

    return res.json({
      success: true,
      message: "Pending students fetched",
      total_pending: students.length,
      data: students,
    });
  } catch (err) {
    console.error("❌ Error in /pending-ids:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching pending students",
    });
  }
});

module.exports = router;
