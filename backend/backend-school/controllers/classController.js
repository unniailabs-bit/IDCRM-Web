// const { QueryTypes } = require("sequelize");
// const sequelize = require("../../config/db");

// // -------------------- Add Class --------------------
// exports.addClass = async (req, res) => {
//   try {
//     const school_id = req.user?.school_id;
//     const { class_name, section } = req.body;

//     if (!school_id) {
//       return res.status(401).json({ success: false, message: "Unauthorized: School not found." });
//     }
//     if (!class_name || !section) {
//       return res.status(400).json({ success: false, message: "Class Name and Section are required." });
//     }

//     const trimmedClassName = class_name.trim();
//     const trimmedSection = section.trim();

//     const existingClass = await sequelize.query(
//       `SELECT id FROM classes WHERE school_id = :school_id AND LOWER(class_name) = LOWER(:class_name)`,
//       { replacements: { school_id, class_name: trimmedClassName }, type: QueryTypes.SELECT }
//     );

//     if (existingClass.length > 0) {
//       return res.status(409).json({ success: false, message: `Class '${trimmedClassName}' already exists.` });
//     }

//     const query = `
//       INSERT INTO classes (school_id, class_name, section, created_at, updated_at)
//       VALUES (:school_id, :class_name, :section, NOW(), NOW())
//       RETURNING *;
//     `;
//     const [insertedClass] = await sequelize.query(query, {
//       replacements: { school_id, class_name: trimmedClassName, section: trimmedSection },
//       type: QueryTypes.INSERT,
//     });

//     res.status(201).json({ success: true, message: "Class added successfully", data: insertedClass[0] });
//   } catch (error) {
//     console.error("Add Class Error:", error);
//     res.status(500).json({ success: false, message: "Server error while adding class" });
//   }
// };

// // -------------------- Add Division (FULL FIX) --------------------
// exports.addDivision = async (req, res) => {
//   try {
//     const school_id = req.user?.school_id;
//     let { class_name, division_name, class_teacher, expected_students } = req.body;

//     if (!school_id) {
//       return res.status(401).json({ success: false, message: "Unauthorized: School not found." });
//     }
//     if (!class_name || !division_name) {
//       return res.status(400).json({ success: false, message: "Class Name & Division Name required." });
//     }

//     class_name = class_name.trim();
//     division_name = division_name.trim();

//     class_teacher = class_teacher?.trim() || null;
//     expected_students = Number(expected_students) || 0;

//     // 1️⃣ Get class_id from class_name
//     const findClass = await sequelize.query(
//       `SELECT id FROM classes WHERE school_id = :school_id AND LOWER(class_name) = LOWER(:class_name)`,
//       { replacements: { school_id, class_name }, type: QueryTypes.SELECT }
//     );

//     if (findClass.length === 0) {
//       return res.status(404).json({ success: false, message: `Class '${class_name}' not found.` });
//     }

//     const class_id = findClass[0].id;

//     // 2️⃣ Check duplicate division within same class
//     const existDivision = await sequelize.query(
//       `SELECT id FROM divisions WHERE class_id = :class_id AND LOWER(division_name)=LOWER(:division_name)`,
//       { replacements: { class_id, division_name }, type: QueryTypes.SELECT }
//     );

//     if (existDivision.length > 0) {
//       return res.status(409).json({ success: false, message: `Division already exists in this class.` });
//     }

//     // 3️⃣ Insert division with class_id
//     const query = `
//       INSERT INTO divisions (class_id, class_name, division_name, class_teacher, expected_students, created_at, updated_at)
//       VALUES (:class_id, :class_name, :division_name, :class_teacher, :expected_students, NOW(), NOW())
//       RETURNING *;
//     `;

//     const [insertedDivision] = await sequelize.query(query, {
//       replacements: { class_id, class_name, division_name, class_teacher, expected_students },
//       type: QueryTypes.INSERT,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Division added successfully",
//       data: insertedDivision[0],
//     });
//   } catch (error) {
//     console.error("Add Division Error:", error);
//     res.status(500).json({ success: false, message: "Server error while adding division" });
//   }
// };

// // -------------------- Get Classes --------------------
// exports.getClasses = async (req, res) => {
//   try {
//     const school_id = Number(req.params.school_id);

//     if (!school_id) {
//       return res.status(400).json({ success: false, message: "School ID is required." });
//     }

//     const query = `
//       SELECT c.*, 
//       (SELECT COUNT(*) FROM divisions d WHERE d.class_id = c.id) AS division_count
//       FROM classes c
//       WHERE c.school_id = :school_id
//       ORDER BY c.id DESC;
//     `;

//     const classes = await sequelize.query(query, {
//       replacements: { school_id },
//       type: QueryTypes.SELECT,
//     });

//     res.status(200).json({ success: true, data: classes });
//   } catch (error) {
//     console.error("Get Classes Error:", error);
//     res.status(500).json({ success: false, message: "Server error while fetching classes" });
//   }
// };

// // -------------------- Get Divisions by Class --------------------
// exports.getDivisions = async (req, res) => {
//   try {
//     const class_name = req.params.class_name?.trim();

//     if (!class_name) {
//       return res.status(400).json({ success: false, message: "Class Name is required." });
//     }

//     const divisions = await sequelize.query(
//       `SELECT * FROM divisions WHERE LOWER(class_name) = LOWER(:class_name) ORDER BY id ASC`,
//       { replacements: { class_name }, type: QueryTypes.SELECT }
//     );

//     if (divisions.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: `No divisions found for class '${class_name}'.`,
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: `Divisions fetched successfully.`,
//       data: divisions,
//     });
//   } catch (error) {
//     console.error("Get Divisions Error:", error);
//     res.status(500).json({ success: false, message: "Server error while fetching divisions" });
//   }
// };

// // -------------------- Delete Class (Full Cascade Fix) --------------------
// exports.deleteClass = async (req, res) => {
//   try {
//     const school_id = req.user?.school_id;
//     const class_name = req.params.class_name?.trim();

//     if (!school_id) {
//       return res.status(401).json({ success: false, message: "Unauthorized." });
//     }
//     if (!class_name) {
//       return res.status(400).json({ success: false, message: "Class Name is required." });
//     }

//     // Find class_id
//     const classData = await sequelize.query(
//       `SELECT id FROM classes WHERE school_id = :school_id AND LOWER(class_name)=LOWER(:class_name)`,
//       { replacements: { school_id, class_name }, type: QueryTypes.SELECT }
//     );

//     if (classData.length === 0) {
//       return res.status(404).json({ success: false, message: "Class not found." });
//     }

//     const class_id = classData[0].id;

//     // Delete related forms
//     await sequelize.query(
//       `DELETE FROM student_forms WHERE class_id = :class_id`,
//       { replacements: { class_id }, type: QueryTypes.DELETE }
//     );

//     // Delete students
//     await sequelize.query(
//       `DELETE FROM students WHERE class_id = :class_id`,
//       { replacements: { class_id }, type: QueryTypes.DELETE }
//     );

//     // Delete divisions
//     await sequelize.query(
//       `DELETE FROM divisions WHERE class_id = :class_id`,
//       { replacements: { class_id }, type: QueryTypes.DELETE }
//     );

//     // Delete class
//     await sequelize.query(
//       `DELETE FROM classes WHERE id = :class_id`,
//       { replacements: { class_id }, type: QueryTypes.DELETE }
//     );

//     return res.json({
//       success: true,
//       message: `Class '${class_name}' and all related data deleted successfully.`,
//     });
//   } catch (error) {
//     console.error("Delete Class Error:", error);
//     return res.status(500).json({ success: false, message: "Server error while deleting class" });
//   }
// };


const { QueryTypes } = require("sequelize");
const sequelize = require("../../config/db");

// -------------------- Add Class --------------------
// NOTE: Section is now at school level, not class level
exports.addClass = async (req, res) => {
  try {
    const school_id = req.user?.school_id;
    const { class_name } = req.body;

    if (!school_id) {
      return res.status(401).json({ success: false, message: "Unauthorized: School not found." });
    }
    if (!class_name) {
      return res.status(400).json({ success: false, message: "Class Name is required." });
    }

    const trimmedClassName = class_name.trim();

    // Check for duplicate class name within the school
    const existingClass = await sequelize.query(
      `SELECT id FROM classes WHERE school_id = :school_id AND LOWER(class_name) = LOWER(:class_name)`,
      { replacements: { school_id, class_name: trimmedClassName }, type: QueryTypes.SELECT }
    );

    if (existingClass.length > 0) {
      return res.status(409).json({ success: false, message: `Class '${trimmedClassName}' already exists in this school.` });
    }

    // Insert class WITHOUT section (section is inherited from school)
    const classQuery = `
      INSERT INTO classes (school_id, class_name, created_at, updated_at)
      VALUES (:school_id, :class_name, NOW(), NOW())
      RETURNING *;
    `;
    const [insertedClass] = await sequelize.query(classQuery, {
      replacements: { school_id, class_name: trimmedClassName },
      type: QueryTypes.INSERT,
    });

    res.status(201).json({
      success: true,
      message: "Class added successfully",
      data: insertedClass[0]
    });
  } catch (error) {
    console.error("Add Class Error:", error);
    res.status(500).json({ success: false, message: "Server error while adding class", error: error.message });
  }
};

// -------------------- Add Division (FULL FIX) --------------------
exports.addDivision = async (req, res) => {
  try {
    const school_id = req.user?.school_id;
    let { class_name, division_name, class_teacher, expected_students } = req.body;

    if (!school_id) {
      return res.status(401).json({ success: false, message: "Unauthorized: School not found." });
    }
    if (!class_name || !division_name) {
      return res.status(400).json({ success: false, message: "Class Name & Division Name required." });
    }
    class_name = class_name.trim();
    division_name = division_name.trim();

    class_teacher = class_teacher?.trim() || null;
    expected_students = Number(expected_students) || 0;

    // Get class_id from class_name
    const findClass = await sequelize.query(
      `SELECT id FROM classes WHERE school_id = :school_id AND LOWER(class_name) = LOWER(:class_name)`,
      { replacements: { school_id, class_name }, type: QueryTypes.SELECT }
    );

    if (findClass.length === 0) {
      return res.status(404).json({ success: false, message: `Class '${class_name}' not found.` });
    }

    const class_id = findClass[0].id;

    // 2️⃣ Check duplicate division within same class
    const existDivision = await sequelize.query(
      `SELECT id FROM divisions WHERE class_id = :class_id AND LOWER(division_name)=LOWER(:division_name)`,
      { replacements: { class_id, division_name }, type: QueryTypes.SELECT }
    );

    if (existDivision.length > 0) {
      return res.status(409).json({ success: false, message: `Division already exists in this class.` });
    }

    // -------------------------------------------------------------------------
    // NEW: ONE TEACHER ONE CLASS RESTRICTION (ID-BASED)
    // -------------------------------------------------------------------------
    if (class_teacher || req.body.teacher_id) {
      const teacher_id = req.body.teacher_id;

      // Check if teacher is already assigned to another division in the SAME school
      const checkQuery = `
        SELECT d.division_name, d.class_name 
        FROM divisions d
        INNER JOIN classes c ON d.class_id = c.id
        WHERE c.school_id = :school_id 
        AND (d.teacher_id = :teacher_id OR (d.class_teacher = :class_teacher AND d.teacher_id IS NULL))
        LIMIT 1
      `;

      const existingAssignment = await sequelize.query(checkQuery, {
        replacements: { school_id, teacher_id: teacher_id || null, class_teacher: class_teacher || null },
        type: QueryTypes.SELECT
      });

      if (existingAssignment.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Teacher is already assigned to Class ${existingAssignment[0].class_name} - ${existingAssignment[0].division_name}. One teacher can only be assigned to one class.`
        });
      }

      // If teacher_id is provided but class_teacher (name) is not, fetch the name to keep both fields in sync
      if (teacher_id) {
        const teacherData = await sequelize.query(
          `SELECT name FROM teachers WHERE id = :teacher_id`,
          { replacements: { teacher_id }, type: QueryTypes.SELECT }
        );
        if (teacherData.length > 0) {
          if (!class_teacher) class_teacher = teacherData[0].name;
        } else {
          // If teacher does not exist, set to null to avoid Foreign Key error
          req.body.teacher_id = null;
        }
      }
    }

    // 3️⃣ Insert division with class_id and teacher_id
    const query = `
      INSERT INTO divisions (class_id, class_name, division_name, class_teacher, teacher_id, expected_students, created_at, updated_at)
      VALUES (:class_id, :class_name, :division_name, :class_teacher, :teacher_id, :expected_students, NOW(), NOW())
      RETURNING *;
    `;

    const [insertedDivision] = await sequelize.query(query, {
      replacements: {
        class_id,
        class_name,
        division_name,
        class_teacher,
        teacher_id: req.body.teacher_id || null,
        expected_students
      },
      type: QueryTypes.INSERT,
    });

    res.status(201).json({
      success: true,
      message: "Division added successfully",
      data: insertedDivision[0],
    });
  } catch (error) {
    console.error("Add Division Error:", error);
    res.status(500).json({ success: false, message: "Server error while adding division" });
  }
};


// -------------------- Get Classes --------------------
// NOTE: Section is now at school level, classes don't have section
exports.getClasses = async (req, res) => {
  try {
    const school_id = Number(req.params.school_id);

    if (!school_id) {
      return res.status(400).json({ success: false, message: "School ID is required." });
    }

    // Get classes with school section info
    const query = `
      SELECT c.*, 
      s.section AS school_section,
      (SELECT COUNT(*) FROM divisions d WHERE d.class_id = c.id) AS division_count
      FROM classes c
      JOIN schools s ON c.school_id = s.id
      WHERE c.school_id = :school_id
      ORDER BY c.id DESC;
    `;

    const classes = await sequelize.query(query, {
      replacements: { school_id },
      type: QueryTypes.SELECT,
    });

    res.status(200).json({ success: true, data: classes });
  } catch (error) {
    console.error("Get Classes Error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching classes" });
  }
};

// -------------------- Get Divisions by Class --------------------
// Supports looking up by :class_name (string) OR :class_id (integer)
exports.getDivisions = async (req, res) => {
  try {
    const { class_name } = req.params;
    const school_id = req.user?.school_id;

    if (!class_name) {
      return res.status(400).json({ success: false, message: "Class Identifier is required." });
    }

    if (!school_id) {
      return res.status(401).json({ success: false, message: "Unauthorized: School information not found in token." });
    }

    let divisions = [];
    let classId = null;

    // Check if input is likely an ID (numeric)
    const isId = /^\d+$/.test(class_name);

    if (isId) {
      // Input is an ID
      classId = parseInt(class_name, 10);

      // Get divisions by class_id
      divisions = await sequelize.query(
        `SELECT d.*, t.name as teacher_name, t.email as teacher_email 
         FROM divisions d
         LEFT JOIN teachers t ON d.teacher_id = t.id
         WHERE d.class_id = :classId 
         ORDER BY d.id ASC`,
        { replacements: { classId }, type: QueryTypes.SELECT }
      );
    } else {
      // Input is a name
      const classNameParam = class_name.trim();

      // Get divisions and resolve class_id
      divisions = await sequelize.query(
        `SELECT d.*, c.id as resolved_class_id, t.name as teacher_name, t.email as teacher_email
         FROM divisions d
         INNER JOIN classes c ON d.class_id = c.id
         LEFT JOIN teachers t ON d.teacher_id = t.id
         WHERE LOWER(d.class_name) = LOWER(:classNameParam)
         AND c.school_id = :school_id
         ORDER BY d.id ASC`,
        { replacements: { classNameParam, school_id }, type: QueryTypes.SELECT }
      );

      if (divisions.length > 0) {
        classId = divisions[0].resolved_class_id;
      } else {
        // If no divisions found, try to find the class ID anyway to get fees? 
        // Or just 404. Let's try to find class ID first if we want empty divisions + fees.
        // For now, let's stick to existing logic: 404 if no divisions found, 
        // BUT the user might want fees even if no divisions? 
        // Let's first check if class exists to get ID if divisions are empty.
        const classCheck = await sequelize.query(
          `SELECT id FROM classes WHERE school_id = :school_id AND LOWER(class_name) = LOWER(:classNameParam)`,
          { replacements: { school_id, classNameParam }, type: QueryTypes.SELECT }
        );
        if (classCheck.length > 0) {
          classId = classCheck[0].id;
        }
      }
    }

    if (!divisions.length && !classId) {
      // If passed ID but no divisions found, we should still try to find if class exists to get fees?
      // If passed Name but no divisions and no class found.
      if (isId) {
        // Verify class exists
        const classCheck = await sequelize.query(
          `SELECT id FROM classes WHERE school_id = :school_id AND id = :classId`,
          { replacements: { school_id, classId }, type: QueryTypes.SELECT }
        );
        if (classCheck.length === 0) {
          return res.status(404).json({ success: false, message: `Class ID '${class_name}' not found.` });
        }
      } else {
        return res.status(404).json({ success: false, message: `Class '${class_name}' not found.` });
      }
    }

    res.status(200).json({
      success: true,
      message: `Divisions fetched successfully.`,
      data: divisions
    });
  } catch (error) {
    console.error("Get Divisions Error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching divisions" });
  }
};

// -------------------- Delete Class (Full Cascade Fix - Modified to use class_id only) --------------------
// Removed the redundant class_name parameter based on the request's intent to use ID.
exports.deleteClass = async (req, res) => {
  try {
    const school_id = req.user?.school_id;
    // ⬇️ CHANGED: Use class_id from params instead of class_name
    const class_id = Number(req.params.class_id);

    if (!school_id) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    if (!class_id) {
      return res.status(400).json({ success: false, message: "Class ID is required." });
    }

    // 1️⃣ Check if class exists and get class_name for success message
    const classData = await sequelize.query(
      `SELECT class_name FROM classes WHERE school_id = :school_id AND id = :class_id`,
      // ⬇️ CHANGED: Used class_id in replacements
      { replacements: { school_id, class_id }, type: QueryTypes.SELECT }
    );

    if (classData.length === 0) {
      return res.status(404).json({ success: false, message: "Class not found." });
    }

    const class_name = classData[0].class_name;

    // 2️⃣ Delete related student forms
    await sequelize.query(
      `DELETE FROM student_forms WHERE class_id = :class_id`,
      { replacements: { class_id }, type: QueryTypes.DELETE }
    );

    // 3️⃣ Delete students
    await sequelize.query(
      `DELETE FROM students WHERE class_id = :class_id`,
      { replacements: { class_id }, type: QueryTypes.DELETE }
    );

    // 4️⃣ Delete divisions
    await sequelize.query(
      `DELETE FROM divisions WHERE class_id = :class_id`,
      { replacements: { class_id }, type: QueryTypes.DELETE }
    );

    // 5️⃣ Delete the class itself
    await sequelize.query(
      `DELETE FROM classes WHERE id = :class_id`,
      { replacements: { class_id }, type: QueryTypes.DELETE }
    );

    return res.json({
      success: true,
      message: `Class '${class_name}' and all related data deleted successfully.`,
    });
  } catch (error) {
    console.error("Delete Class Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting class",
      error: error.message
    });
  }
};
// -------------------- Update Class (Modified to update linked divisions AND fees) --------------------
exports.updateClass = async (req, res) => {
  try {
    const school_id = req.user?.school_id;
    const class_id = Number(req.params.class_id);
    const { new_class_name } = req.body;

    if (!school_id) return res.status(401).json({ success: false, message: "Unauthorized." });
    if (!class_id) return res.status(400).json({ success: false, message: "Class ID is required." });

    // Ensure class exists
    const classData = await sequelize.query(
      `SELECT id, class_name FROM classes WHERE school_id = :school_id AND id = :class_id`,
      { replacements: { school_id, class_id }, type: QueryTypes.SELECT }
    );

    if (!classData.length) return res.status(404).json({ success: false, message: "Class not found." });

    // --- Update Class Name Logic ---
    let updatedClass = null;
    const trimmedNewClassName = new_class_name?.trim();

    if (trimmedNewClassName) {
      // Check if new class name already exists for this school (excluding current class)
      const existingClass = await sequelize.query(
        `SELECT id FROM classes WHERE school_id = :school_id AND LOWER(class_name) = LOWER(:class_name) AND id != :class_id`,
        { replacements: { school_id, class_name: trimmedNewClassName, class_id }, type: QueryTypes.SELECT }
      );

      if (existingClass.length > 0) {
        return res.status(409).json({ success: false, message: `Class '${trimmedNewClassName}' already exists in this school.` });
      }

      // 1️⃣ Update class
      const updated = await sequelize.query(
        `UPDATE classes SET 
                class_name = :class_name,
                updated_at = NOW()
            WHERE id = :class_id
            RETURNING *`,
        {
          replacements: {
            class_id,
            class_name: trimmedNewClassName
          },
          type: QueryTypes.UPDATE
        }
      );
      updatedClass = updated[0][0];

      // 2️⃣ Update linked divisions if class_name changed
      if (trimmedNewClassName !== classData[0].class_name) {
        await sequelize.query(
          `UPDATE divisions
                    SET class_name = :new_class_name,
                        updated_at = NOW()
                WHERE class_id = :class_id`,
          { replacements: { class_id, new_class_name: trimmedNewClassName }, type: QueryTypes.UPDATE }
        );
      }
    } else {
      updatedClass = classData[0]; // Keep existing if name not changed
    }


    res.json({
      success: true,
      message: "Class updated successfully",
      data: updatedClass
    });

  } catch (error) {
    console.error("Update Class Error:", error);
    res.status(500).json({ success: false, message: "Server error while updating class" });
  }
};


// -------------------- Update Division --------------------
// This function is now correctly defined outside the previous one
exports.updateDivision = async (req, res) => {
  try {
    const school_id = req.user?.school_id;
    const { division_id } = req.params;
    const { division_name, class_name, class_id, class_teacher, expected_students } = req.body || {};

    if (!school_id) return res.status(401).json({ success: false, message: "Unauthorized." });
    if (!division_id) return res.status(400).json({ success: false, message: "Division ID is required." });

    let newClassId = class_id || null;
    let newClassName = null;

    // If class_name is provided instead of id, fetch id
    if (class_name) {
      const cls = await sequelize.query(
        `SELECT id FROM classes WHERE school_id = :school_id AND LOWER(class_name) = LOWER(:class_name) LIMIT 1`,
        { replacements: { school_id, class_name }, type: QueryTypes.SELECT }
      );
      if (cls.length === 0) return res.status(404).json({ success: false, message: `Class '${class_name}' not found.` });
      newClassId = cls[0].id;
      newClassName = class_name;
    }

    let finalTeacherId = req.body.teacher_id !== undefined ? req.body.teacher_id : null;
    let finalTeacherName = class_teacher !== undefined ? class_teacher : null;

    // --- ONE TEACHER ONE CLASS CHECK ---
    if (finalTeacherId || finalTeacherName) {
      const checkQuery = `
        SELECT d.division_name, d.class_name 
        FROM divisions d
        INNER JOIN classes c ON d.class_id = c.id
        WHERE c.school_id = :school_id 
        AND d.id != :division_id
        AND (d.teacher_id = :teacher_id OR (d.class_teacher = :class_teacher AND d.teacher_id IS NULL))
        LIMIT 1
      `;
      const assignment = await sequelize.query(checkQuery, {
        replacements: { school_id, division_id, teacher_id: finalTeacherId || null, class_teacher: finalTeacherName || null },
        type: QueryTypes.SELECT
      });

      if (assignment.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Teacher is already assigned to Class ${assignment[0].class_name} - ${assignment[0].division_name}.`
        });
      }

      // Sync name
      if (finalTeacherId && !finalTeacherName) {
        const teacherData = await sequelize.query(
          `SELECT name FROM teachers WHERE id = :teacher_id AND school_id = :school_id`,
          { replacements: { teacher_id: finalTeacherId, school_id }, type: QueryTypes.SELECT }
        );
        if (teacherData.length > 0) finalTeacherName = teacherData[0].name;
      }
    }

    const updated = await sequelize.query(
      `UPDATE divisions
         SET division_name = COALESCE(:division_name, division_name),
             class_teacher = :class_teacher,
             teacher_id = :teacher_id,
             expected_students = COALESCE(:expected_students, expected_students),
             class_id = COALESCE(:class_id, class_id),
             class_name = COALESCE(:class_name, class_name),
             updated_at = NOW()
         WHERE id = :division_id
         RETURNING *`,
      {
        replacements: {
          division_id,
          division_name: division_name !== undefined ? division_name : null,
          class_teacher: finalTeacherName,
          teacher_id: finalTeacherId,
          expected_students: expected_students !== undefined ? expected_students : null,
          class_id: newClassId,
          class_name: newClassName,
        },
        type: QueryTypes.UPDATE,
      }
    );

    if (!updated[0].length) return res.status(404).json({ success: false, message: "Division not found." });

    res.json({ success: true, message: "Division updated successfully", data: updated[0][0] });
  } catch (error) {
    console.error("Update Division Error:", error);
    res.status(500).json({ success: false, message: "Server error while updating division" });
  }
};

// -------------------- Delete Division --------------------
exports.deleteDivision = async (req, res) => {
  try {
    const school_id = req.user?.school_id;
    const { division_id } = req.params;

    if (!school_id) return res.status(401).json({ success: false, message: "Unauthorized." });
    if (!division_id) return res.status(400).json({ success: false, message: "Division ID is required." });

    // 1️⃣ Check for existing student forms
    const formsCheck = await sequelize.query(
      `SELECT id FROM student_forms WHERE division_id = :division_id LIMIT 1`,
      { replacements: { division_id }, type: QueryTypes.SELECT }
    );

    // 2️⃣ Check for existing students
    const studentsCheck = await sequelize.query(
      `SELECT id FROM students WHERE division_id = :division_id LIMIT 1`,
      { replacements: { division_id }, type: QueryTypes.SELECT }
    );

    if (formsCheck.length > 0 || studentsCheck.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete division: There are students or admission forms associated with this division. ."
      });
    }

    // 3️⃣ Delete division if safe
    await sequelize.query(
      `DELETE FROM divisions WHERE id = :division_id`,
      { replacements: { division_id }, type: QueryTypes.DELETE }
    );
    res.json({ success: true, message: "Division deleted successfully." });
  } catch (error) {
    console.error("Delete Division Error:", error);
    res.status(500).json({ success: false, message: "Server error while deleting division" });
  }
};