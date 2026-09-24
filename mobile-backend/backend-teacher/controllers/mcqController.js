const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");
const { sendPushToClass } = require("../../utils/pushNotification");
const multer = require("multer");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

// -----------------------------
// Multer setup for file upload
// - Supports:
//   - MCQ Excel file       -> field: "mcq_file" or legacy "file"
//   - Material file(s)     -> field: "material_files"
// -----------------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Separate folders for MCQ excel and material files
    if (file.fieldname === "material_files") {
      const materialsPath = path.join(__dirname, "../../uploads/materials");
      if (!fs.existsSync(materialsPath)) fs.mkdirSync(materialsPath, { recursive: true });
      return cb(null, materialsPath);
    }

    const uploadPath = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    return cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniquePrefix = Date.now() + "_" + Math.round(Math.random() * 1e9);
    // Sanitize filename: replace spaces with underscores and remove non-alphanumeric except . and _
    const sanitizedName = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, uniquePrefix + "_" + sanitizedName);
  }
});

// Allow both old and new field names so existing clients keep working
exports.uploadExcel = multer({ storage }).fields([
  { name: "mcq_file", maxCount: 1 },       // preferred for MCQ Excel
  { name: "file", maxCount: 1 },           // legacy Excel field
  { name: "material_files", maxCount: 10 } // material files (pdf, doc, video, etc.)
]);

// -----------------------------
// Get MCQs for logged-in teacher
// -----------------------------
exports.getTeacherMcqs = async (req, res) => {
  try {
    const teacher = req.teacher;
    const { class_id, division_id, subject_id } = req.query;

    if (!teacher || !teacher.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    let query = `
      SELECT q.id, q.school_id, q.teacher_id, q.class_id, q.division_id, 
             q.question, q.option_a, q.option_b, q.option_c, q.option_d, 
             q.correct_answer, q.explanation, q.is_active, q.created_at, 
             q.updated_at, q.material_id, q.subject_id, q.title,
             s.subject_name
      FROM mcq_questions q
      LEFT JOIN teacher_subjects s ON q.subject_id = s.id
      WHERE q.teacher_id = :teacher_id
    `;

    const replacements = { teacher_id: teacher.id };

    if (class_id) {
      query += ` AND q.class_id = :class_id`;
      replacements.class_id = class_id;
    }

    if (division_id) {
      query += ` AND q.division_id = :division_id`;
      replacements.division_id = division_id;
    }

    if (subject_id) {
      query += ` AND q.subject_id = :subject_id`;
      replacements.subject_id = subject_id;
    }

    query += ` ORDER BY q.id ASC`;

    const mcqs = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT
    });

    // Grouping by title + subject_id
    const groupedMcqs = mcqs.reduce((acc, mcq) => {
      let groupTitle = mcq.title;
      
      if (!groupTitle) {
        if (mcq.subject_name) {
          groupTitle = `${mcq.subject_name} Practice`;
        } else {
          groupTitle = "General Practice";
        }
      }

      // Unique key for grouping
      const groupKey = `${groupTitle}_${mcq.subject_id || "general"}`;

      if (!acc[groupKey]) {
        acc[groupKey] = {
          title: groupTitle,
          subject_name: mcq.subject_name || "General",
          subject_id: mcq.subject_id || null,
          class_id: mcq.class_id,
          division_id: mcq.division_id,
          mcqs: []
        };
      }
      // Also clean up individual mcq object subject_name
      mcq.subject_name = mcq.subject_name || "General";
      acc[groupKey].mcqs.push(mcq);
      return acc;
    }, {});

    return res.json({
      success: true,
      total_groups: Object.keys(groupedMcqs).length,
      data: Object.values(groupedMcqs)
    });
  } catch (error) {
    console.error("Get Teacher MCQs Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch MCQs"
    });
  }
};

/**
 * UPDATE SINGLE MCQ
 */
exports.updateMcq = async (req, res) => {
  try {
    const teacher = req.teacher;
    const { id, question, option_a, option_b, option_c, option_d, correct_answer, subject_id } = req.body;

    if (!teacher || !teacher.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const [result] = await sequelize.query(
      `
      UPDATE mcq_questions 
      SET question = :question, option_a = :option_a, option_b = :option_b, 
          option_c = :option_c, option_d = :option_d, correct_answer = :correct_answer,
          subject_id = :subject_id, title = :title
      WHERE id = :id AND teacher_id = :teacher_id
      RETURNING *
      `,
      {
        replacements: { 
          id, question, option_a, option_b, option_c, option_d, 
          correct_answer, subject_id, title, teacher_id: teacher.id 
        },
        type: QueryTypes.UPDATE
      }
    );

    if (!result || result.length === 0) {
      return res.status(404).json({ success: false, message: "MCQ not found" });
    }

    return res.json({ success: true, message: "MCQ updated successfully" });

  } catch (error) {
    console.error("Update MCQ Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * DELETE SINGLE MCQ
 */
exports.deleteMcq = async (req, res) => {
  try {
    const teacher = req.teacher;
    const { id } = req.params;

    if (!teacher || !teacher.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await sequelize.query(
      `DELETE FROM mcq_questions WHERE id = :id AND teacher_id = :teacher_id`,
      {
        replacements: { id, teacher_id: teacher.id },
        type: QueryTypes.DELETE
      }
    );

    return res.json({ success: true, message: "MCQ deleted successfully" });

  } catch (error) {
    console.error("Delete MCQ Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// -----------------------------
// Delete MCQ Group by Title and Subject
// -----------------------------
exports.deleteMcqGroupByTitle = async (req, res) => {
  try {
    const teacher = req.teacher;
    const { title, subject_id, class_id, division_id } = req.body;

    if (!title || !class_id || !division_id) {
      return res.status(400).json({
        success: false,
        message: "title, class_id, and division_id are required"
      });
    }

    // Handle NULL subject_id for General MCQs
    const subjectFilter = subject_id ? "= :subject_id" : "IS NULL";

    await sequelize.query(
      `DELETE FROM mcq_questions 
       WHERE teacher_id = :teacher_id 
       AND class_id = :class_id
       AND division_id = :division_id
       AND title = :title
       AND subject_id ${subjectFilter}`,
      {
        replacements: { 
          teacher_id: teacher.id, 
          class_id, 
          division_id, 
          title, 
          subject_id 
        },
        type: QueryTypes.DELETE
      }
    );

    return res.json({
      success: true,
      message: `MCQ Group '${title}' deleted successfully`
    });
  } catch (error) {
    console.error("Delete MCQ Group Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete MCQ group"
    });
  }
};

// -----------------------------
// Delete selected MCQs for teacher (Batch Delete)
// -----------------------------
exports.deleteTeacherMcqs = async (req, res) => {
  try {
    const teacher = req.teacher;
    const { mcq_ids, mcqIds } = req.body;
    const finalIds = mcq_ids || mcqIds;

    if (!finalIds || !Array.isArray(finalIds) || finalIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No MCQ IDs provided for deletion"
      });
    }

    await sequelize.query(
      `DELETE FROM mcq_questions 
       WHERE teacher_id = :teacher_id 
       AND id IN (:finalIds)`,
      {
        replacements: { teacher_id: teacher.id, finalIds },
        type: sequelize.QueryTypes.DELETE
      }
    );

    return res.json({
      success: true,
      message: "Selected MCQs deleted successfully",
      deleted_count: finalIds.length
    });
  } catch (error) {
    console.error("Delete Teacher MCQs Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete MCQs"
    });
  }
};

// -----------------------------
// Add MCQs from Excel (no auto-delete)
// -----------------------------
exports.addMcqQuestions = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const teacher = req.teacher;
    const {
      class_id,
      division_id,
      material_id,       // optional existing material id (Scenario 1)
      material_type,     // optional for creating new material (Scenario 2)
      material_title,    // optional for creating new material (Scenario 2)
      create_material,   // optional flag like "true"/true to force Scenario 2
      subject_id,        // Changed to subject_id
      title              // MCQ Title
    } = req.body;

    // Pick MCQ excel file from supported fields
    const excelFile =
      (req.files && req.files.mcq_file && req.files.mcq_file[0]) ||
      (req.files && req.files.file && req.files.file[0]) ||
      req.file; // extreme legacy fallback

    if (!excelFile) {
      return res.status(400).json({
        success: false,
        message: "Excel file is required"
      });
    }

    // ---------------------------------------
    // Resolve Material ID (3 Scenarios)
    // ---------------------------------------
    let resolvedMaterialId = null;

    // All material files (for scenario 2)
    const materialFiles =
      (req.files && req.files.material_files) || [];

    // Scenario 1: Existing material_id is provided
    if (material_id) {
      const [existingMaterial] = await sequelize.query(
        `
        SELECT id
        FROM materials
        WHERE id = :material_id
          AND teacher_id = :teacher_id
          AND school_id = :school_id
          AND class_id = :class_id
          AND division_id = :division_id
        `,
        {
          replacements: {
            material_id,
            teacher_id: teacher.id,
            school_id: teacher.school_id,
            class_id,
            division_id
          },
          type: QueryTypes.SELECT,
          transaction
        }
      );

      if (!existingMaterial) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Invalid material_id for this teacher / class / division"
        });
      }

      resolvedMaterialId = existingMaterial.id;

    } else if (create_material || material_title || material_type || materialFiles.length > 0) {
      // Scenario 2: Create a new material + MCQs + material files in the same API

      // Basic validation
      if (!class_id || !division_id) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "class_id and division_id are required when creating material"
        });
      }

      // At least one material file should be present when creating a material with files
      if (!materialFiles || materialFiles.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "At least one material file is required when creating material with MCQs"
        });
      }

      // -----------------------------
      // Defaults: type + title
      // -----------------------------
      // Default material_type -> "textbooks" if not provided
      let finalMaterialType = material_type || "textbooks";

      // Default material_title -> first file name (without extension) if not provided
      let finalMaterialTitle = material_title;
      if (!finalMaterialTitle) {
        const firstFile = materialFiles[0];
        if (firstFile && firstFile.originalname) {
          const original = firstFile.originalname;
          finalMaterialTitle = original.includes(".")
            ? original.substring(0, original.lastIndexOf("."))
            : original;
        } else {
          finalMaterialTitle = "Untitled Material";
        }
      }

      // Validate material_type against allowed list (including default)
      const ALLOWED_MATERIAL_TYPES = ["textbooks", "notes", "question_papers", "videos"];
      if (!ALLOWED_MATERIAL_TYPES.includes(finalMaterialType)) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Invalid material_type"
        });
      }
      // Build attached_files array similar to materialController
      const attachedFiles = materialFiles.map(
        file => `uploads/materials/${file.filename}`
      );
      const pgArray = `{${attachedFiles.map(f => `"${f}"`).join(",")}}`;

      // Insert material row (with files)
      const [materialInsert] = await sequelize.query(
        `
        INSERT INTO materials
          (teacher_id, school_id, class_id, division_id, material_type, title, subject_id, attached_files)
        VALUES
          (:teacher_id, :school_id, :class_id, :division_id, :material_type, :title, :subject_id, :attached_files)
        RETURNING id
        `,
        {
          replacements: {
            teacher_id: teacher.id,
            school_id: teacher.school_id,
            class_id,
            division_id,
            material_type: finalMaterialType,
            title: finalMaterialTitle,
            subject_id,
            attached_files: pgArray
          },
          type: QueryTypes.INSERT,
          transaction
        }
      );

      resolvedMaterialId = materialInsert[0].id;

    } else {
      // Scenario 3: Only MCQs, no material_id and no material info
      resolvedMaterialId = null;
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelFile.path);
    const worksheet = workbook.worksheets[0];

    const mcqs = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      mcqs.push({
        question: row.getCell(1).value,
        option_a: row.getCell(2).value,
        option_b: row.getCell(3).value,
        option_c: row.getCell(4).value,
        option_d: row.getCell(5).value,
        correct_answer: row.getCell(6).value
      });
    });

    if (mcqs.length === 0) {
      return res.status(400).json({ success: false, message: "No MCQs found in Excel" });
    }

    const insertData = mcqs.map((mcq, index) => {
      if (
        !mcq.question ||
        !mcq.option_a ||
        !mcq.option_b ||
        !mcq.option_c ||
        !mcq.option_d ||
        !mcq.correct_answer
      ) {
        throw new Error(`Invalid MCQ data at row ${index + 1}`);
      }

      const correctAnswer = mcq.correct_answer.toString().trim().toUpperCase();
      if (!["A", "B", "C", "D"].includes(correctAnswer)) {
        throw new Error(`Correct answer must be A/B/C/D at row ${index + 1}`);
      }

      return {
        school_id: teacher.school_id,
        teacher_id: teacher.id,
        class_id,
        division_id,
        material_id: resolvedMaterialId,
        subject_id: subject_id || null,
        question: mcq.question.toString().trim(),
        option_a: mcq.option_a.toString().trim(),
        option_b: mcq.option_b.toString().trim(),
        option_c: mcq.option_c.toString().trim(),
        option_d: mcq.option_d.toString().trim(),
        correct_answer: correctAnswer,
        title: title ? title.toString().trim() : null
      };
    });

    await sequelize.query(
      `INSERT INTO mcq_questions
      (school_id, teacher_id, class_id, division_id, material_id, subject_id, question, option_a, option_b, option_c, option_d, correct_answer, title)
      VALUES
      ${insertData
        .map(
          (_, i) => `(
            :school_id_${i},
            :teacher_id_${i},
            :class_id_${i},
            :division_id_${i},
            :material_id_${i},
            :subject_id_${i},
            :question_${i},
            :option_a_${i},
            :option_b_${i},
            :option_c_${i},
            :option_d_${i},
            :correct_answer_${i},
            :title_${i}
          )`
        )
        .join(",")}`,
      {
        replacements: insertData.reduce((acc, row, i) => {
          Object.keys(row).forEach(key => {
            acc[`${key}_${i}`] = row[key];
          });
          return acc;
        }, {}),
        transaction
      }
    );

    await transaction.commit();
    // Only delete MCQ excel file; keep material files
    if (excelFile && fs.existsSync(excelFile.path)) {
      fs.unlinkSync(excelFile.path);
    }

    res.json({
      success: true,
      message: "MCQs added successfully",
      total_mcqs: insertData.length
    });

    // 🚀 Send Notifications in background
    (async () => {
        const payload = {
            title: "New MCQ Practice",
            body: `New MCQ Practice uploaded: ${title || 'General Practice'}`,
            data: { type: 'mcq', class_id, division_id }
        };
        sendPushToClass(teacher.school_id, class_id, division_id, payload);
    })();

  } catch (error) {
    await transaction.rollback();
    console.error("Add MCQ Error:", error);

    // Try to delete excel file if present
    const excelFile =
      (req.files && req.files.mcq_file && req.files.mcq_file[0]) ||
      (req.files && req.files.file && req.files.file[0]) ||
      req.file;

    if (excelFile && fs.existsSync(excelFile.path)) {
      fs.unlinkSync(excelFile.path);
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add MCQs"
    });
  }
};

// -----------------------------
// Get Materials list for MCQ mapping
// (material_id, material_title, material_type)
// -----------------------------
exports.getTeacherMaterialsForMcq = async (req, res) => {
  try {
    const teacher = req.teacher;
    const { class_id, division_id } = req.query;

    if (!teacher || !teacher.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    let query = `
      SELECT 
        id AS material_id,
        title AS material_title,
        material_type
      FROM materials
      WHERE teacher_id = :teacher_id
    `;

    const replacements = {
      teacher_id: teacher.id,
      material_type: "textbooks"
    };

    // Only return materials of type "textbooks" for MCQ mapping
    query += ` AND material_type = :material_type`;

    if (class_id) {
      query += ` AND class_id = :class_id`;
      replacements.class_id = class_id;
    }

    if (division_id) {
      query += ` AND division_id = :division_id`;
      replacements.division_id = division_id;
    }

    query += ` ORDER BY created_at DESC`;

    const materials = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT
    });

    return res.json({
      success: true,
      count: materials.length,
      materials
    });
  } catch (error) {
    console.error("Get Teacher Materials For MCQ Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

