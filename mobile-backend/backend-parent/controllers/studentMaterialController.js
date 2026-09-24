const sequelize = require("../../config/db");

// --------------------
// Allowed Material Types
// --------------------
const MATERIAL_TYPES = ["chapter", "notes", "video"];

// --------------------
// Get Materials for Student / Parent
// --------------------
exports.getStudentMaterials = async (req, res) => {
  try {
    // ✅ Support both student and parent login
    // If parent login, map to req.parent
    const user = req.student || req.parent;

    if (!user || !user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const { material_type, subject_id } = req.query;

    // Validate material_type if provided
    if (material_type && !MATERIAL_TYPES.includes(material_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid material type"
      });
    }

    // --------------------
    // Build SQL query
    // --------------------
    let query = `
      SELECT m.id, m.title, m.subject_id, s.subject_name, m.material_type, m.attached_files, m.created_at
      FROM materials m
      LEFT JOIN teacher_subjects s ON m.subject_id = s.id
      WHERE m.class_id = :class_id
        AND m.division_id = :division_id
        AND m.school_id = :school_id
    `;

    const replacements = {
      class_id: user.class_id,
      division_id: user.division_id,
      school_id: user.school_id
    };

    // Optional filter by material_type
    if (material_type) {
      query += ` AND m.material_type = :material_type`;
      replacements.material_type = material_type;
    }

    // Optional filter by subject_id
    if (subject_id) {
      query += ` AND m.subject_id = :subject_id`;
      replacements.subject_id = subject_id;
    }


    query += ` ORDER BY m.created_at DESC`;

    // Execute query
    const materials = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    // --------------------
    // Response
    // --------------------
    res.json({
      success: true,
      count: materials.length,
      materials
    });

  } catch (error) {
    console.error("Get Student Materials Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * GET UNIQUE SUBJECTS FOR STUDENT
 */
exports.getStudentSubjects = async (req, res) => {
  try {
    const user = req.student || req.parent;

    if (!user || !user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const subjects = await sequelize.query(
      `
      SELECT id, subject_name 
      FROM teacher_subjects 
      WHERE class_id = :class_id AND division_id = :division_id AND school_id = :school_id
      ORDER BY subject_name ASC
      `,
      {
        replacements: {
          class_id: user.class_id,
          division_id: user.division_id,
          school_id: user.school_id
        },
        type: sequelize.QueryTypes.SELECT
      }
    );

    return res.json({
      success: true,
      subjects
    });

  } catch (error) {
    console.error("Get Student Subjects Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

