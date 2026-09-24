const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");

// -----------------------------
// Get MCQs for Student
// -----------------------------
exports.getMcqsForStudent = async (req, res) => {
  try {
    const { school_id } = req.user;
    const { material_id } = req.query;

    if (!school_id) {
      return res.status(400).json({ success: false, message: "School ID not found" });
    }

    let query = `SELECT id, question, option_a, option_b, option_c, option_d 
                 FROM mcq_questions 
                 WHERE school_id = :school_id AND is_active = true`;
    const replacements = { school_id };

    if (material_id) {
      query += ` AND material_id = :material_id`;
      replacements.material_id = material_id;
    }

    const mcqs = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT
    });

    return res.json({
      success: true,
      mcqs
    });

  } catch (error) {
    console.error("Get MCQs Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
