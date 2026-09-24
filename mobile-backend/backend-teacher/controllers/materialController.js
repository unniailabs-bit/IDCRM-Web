const sequelize = require("../../config/db");
const { sendPushToClass } = require("../../utils/pushNotification");


const MATERIAL_TYPES = {
  CHAPTER: "chapter",
  NOTES: "notes",
  VIDEO: "video"
};

const FILE_TYPES = {
  chapter: ["pdf", "doc", "docx"],
  notes: ["pdf", "doc", "docx"],
  video: ["mp4", "mov", "avi"]
};



exports.uploadMaterials = async (req, res) => {
  try {
    const teacher = req.teacher;
    const { class_id, division_id, material_type, title, subject_id } = req.body;

    if (!class_id || !division_id || !material_type || !title || !subject_id) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing (class_id, division_id, material_type, title, subject_id)"
      });
    }

    // Validation for material_type (trimmed and lowercase for flexibility)
    const normalizedType = material_type ? material_type.toString().trim().toLowerCase() : "";
    const allowedTypes = ["chapter", "notes", "video"];
    if (!allowedTypes.includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid material_type. Must be 'chapter', 'notes', or 'video'."
      });
    }

    //  Material type validation
    if (!Object.values(MATERIAL_TYPES).includes(material_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid material type"
      });
    }

    //  Files check
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded"
      });
    }

    //  File extension validation
    const allowedExtensions = FILE_TYPES[material_type];

    for (const file of req.files) {
      const ext = file.originalname.split(".").pop().toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        return res.status(400).json({
          success: false,
          message: `Only ${allowedExtensions.join(", ")} files allowed for ${material_type}`
        });
      }
    }

    //  Prepare files array
    const attachedFiles = req.files.map(
      file => `uploads/materials/${file.filename}`
    );

    const pgArray = `{${attachedFiles.map(f => `"${f}"`).join(",")}}`;

    //  Insert into DB
    const [result] = await sequelize.query(
      `INSERT INTO materials (teacher_id, school_id, class_id, division_id, material_type, title, subject_id, attached_files)
       VALUES (:teacher_id, :school_id, :class_id, :division_id, :material_type, :title, :subject_id, :attached_files) 
       RETURNING id, teacher_id, school_id, class_id, division_id, material_type, title, subject_id, attached_files, created_at, updated_at`,
      {
        replacements: {
          teacher_id: teacher.id,
          school_id: teacher.school_id,
          class_id,
          division_id,
          material_type: normalizedType,
          title,
          subject_id,
          attached_files: pgArray
        },
        type: sequelize.QueryTypes.INSERT
      }
    );

    res.json({
      success: true,
      message: "Material uploaded successfully",
      material: result[0]
    });

    // 🚀 Send Notifications in background
    (async () => {
        const payload = {
            title: "New Study Material",
            body: `New ${normalizedType} uploaded: ${title}`,
            data: { type: 'material', id: result[0].id, material_type: normalizedType }
        };
        sendPushToClass(teacher.school_id, class_id, division_id, payload);
    })();

  } catch (error) {
    console.error("Upload Materials Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};



exports.getMaterials = async (req, res) => {
  try {
    const teacher = req.teacher;
    const { class_id, division_id, material_type, subject_id } = req.query;

    // 1️⃣ Auth check
    if (!teacher || !teacher.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // 2️⃣ Validate material_type (if provided)
    if (
      material_type &&
      !Object.values(MATERIAL_TYPES).includes(material_type)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid material type filter"
      });
    }

    // 3️⃣ Build query dynamically (STRICT AND FILTERS)
    let query = `
      SELECT m.id, m.teacher_id, m.school_id, m.class_id, m.division_id, 
             m.material_type, m.title, m.subject_id, m.attached_files,
             m.created_at, m.updated_at, s.subject_name
      FROM materials m
      LEFT JOIN teacher_subjects s ON m.subject_id = s.id
      WHERE m.teacher_id = :teacher_id
    `;

    const replacements = {
      teacher_id: teacher.id
    };

    if (class_id) {
      query += ` AND class_id = :class_id`;
      replacements.class_id = class_id;
    }

    if (division_id) {
      query += ` AND division_id = :division_id`;
      replacements.division_id = division_id;
    }

    if (material_type) {
      query += ` AND m.material_type = :material_type`;
      replacements.material_type = material_type;
    }

    if (subject_id) {
      query += ` AND m.subject_id = :subject_id`;
      replacements.subject_id = subject_id;
    }

    query += ` ORDER BY m.created_at DESC`;

    // 4️⃣ Execute query
    const materials = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    // Convert BIGINT string IDs to Numbers to prevent Flutter cast errors
    const formattedMaterials = materials.map(m => ({
      ...m,
      teacher_id: Number(m.teacher_id)
    }));

    return res.json({
      success: true,
      count: formattedMaterials.length,
      materials: formattedMaterials
    });

  } catch (error) {
    console.error("Get Materials Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * GET UNIQUE SUBJECTS FOR TEACHER
 */
exports.getTeacherSubjects = async (req, res) => {
  try {
    const teacher = req.teacher;
    const { class_id, division_id } = req.query;

    if (!teacher || !teacher.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!class_id || !division_id) {
      return res.status(400).json({ success: false, message: "class_id and division_id are required" });
    }

    const subjects = await sequelize.query(
      `
      SELECT id, subject_name 
      FROM teacher_subjects 
      WHERE teacher_id = :teacher_id 
        AND class_id = :class_id 
        AND division_id = :division_id
      ORDER BY subject_name ASC
      `,
      {
        replacements: {
          teacher_id: teacher.id,
          class_id,
          division_id
        },
        type: sequelize.QueryTypes.SELECT
      }
    );

    return res.json({
      success: true,
      subjects
    });

  } catch (error) {
    console.error("Get Teacher Subjects Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * UPDATE MATERIAL
 */
exports.updateMaterial = async (req, res) => {
  try {
    const teacher = req.teacher;
    const { id, title, material_type, subject_id } = req.body;

    if (!teacher || !teacher.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!id) {
      return res.status(400).json({ success: false, message: "id is required" });
    }

    // Build dynamic update query
    let updateFields = [];
    let replacements = { id, teacher_id: teacher.id };

    if (title !== undefined) {
      updateFields.push("title = :title");
      replacements.title = title;
    }
    if (material_type !== undefined) {
      updateFields.push("material_type = :material_type");
      replacements.material_type = material_type;
    }
    if (subject_id !== undefined) {
      updateFields.push("subject_id = :subject_id");
      replacements.subject_id = subject_id;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }

    const query = `
      UPDATE materials 
      SET ${updateFields.join(", ")}
      WHERE id = :id AND teacher_id = :teacher_id
      RETURNING *
    `;

    const [result] = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.UPDATE
    });

    if (!result || result.length === 0) {
      return res.status(404).json({ success: false, message: "Material not found or unauthorized" });
    }

    return res.json({ success: true, message: "Material updated successfully", material: result[0] });

  } catch (error) {
    console.error("Update Material Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * DELETE MATERIAL
 */
exports.deleteMaterial = async (req, res) => {
  try {
    const teacher = req.teacher;
    const { id } = req.params;

    if (!teacher || !teacher.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Optional: Delete files from disk here if needed

    await sequelize.query(
      `DELETE FROM materials WHERE id = :id AND teacher_id = :teacher_id`,
      {
        replacements: { id, teacher_id: teacher.id },
        type: sequelize.QueryTypes.DELETE
      }
    );

    return res.json({ success: true, message: "Material deleted successfully" });

  } catch (error) {
    console.error("Delete Material Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
