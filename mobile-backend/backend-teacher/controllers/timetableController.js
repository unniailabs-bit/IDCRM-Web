const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");
const { sendPushToUsers } = require("../../utils/pushNotification");

// ---------------- CREATE ----------------
exports.createTimetable = async (req, res) => {
  try {
    const teacher = req.teacher;
    const {
      title,
      exam_type,
      start_date,
      end_date,
      exam_schedule,
      class_id
    } = req.body;

    let finalClassId = class_id || teacher.class_id;

    if (!finalClassId) {
      // Find classes assigned to this teacher using teacher_id
      const assignedClasses = await sequelize.query(
        `SELECT DISTINCT class_id FROM divisions WHERE teacher_id = :teacher_id`,
        { replacements: { teacher_id: teacher.id }, type: QueryTypes.SELECT }
      );

      if (assignedClasses.length === 1) {
        finalClassId = assignedClasses[0].class_id;
      } else if (assignedClasses.length > 1) {
        return res.status(200).json({
          success: false,
          message: "You have multiple classes. Please select a specific class."
        });
      }
    }

    if (!finalClassId) {
      return res.status(200).json({
        success: false,
        message: "Please select a class to create a timetable."
      });
    }

    // Optional file
    const timetable_file = req.file ? `/uploads/timetables/${req.file.filename}` : null;

    // ✅ Validate all required fields for DB (timetable_file is now optional for Step 1)
    if (!title || !exam_type || !start_date || !end_date) {
      return res.status(200).json({
        success: false,
        message: "Please fill all required fields (title, class, type).. title, exam_type, start_date, and end_date are required."
      });
    }

    // exam_schedule JSON parse (default to empty array if not provided in Step 1)
    let schedule = [];
    if (exam_schedule) {
      schedule = typeof exam_schedule === "string" ? JSON.parse(exam_schedule) : exam_schedule;
    }

    const result = await sequelize.query(
      `INSERT INTO timetables
       (school_id, class_id, teacher_id, title, exam_type,
        start_date, end_date, timetable_file, exam_schedule, is_active)
       VALUES (:school_id, :class_id, :teacher_id, :title, :exam_type,
        :start_date, :end_date, :timetable_file, :exam_schedule, :is_active)
       RETURNING *`,
      {
        replacements: {
          school_id: teacher.school_id || null,
          class_id: finalClassId,
          teacher_id: teacher.id || null,
          title: title || null,
          exam_type: exam_type || null,
          start_date: start_date || null,
          end_date: end_date || null,
          timetable_file,
          exam_schedule: JSON.stringify(schedule),
          is_active: true
        },
        type: QueryTypes.INSERT
      }
    );

    res.status(201).json({
      success: true,
      message: "Timetable created successfully",
      data: {
        id: result[0][0].id
      }
    });

    // 🚀 Send Push Notification to all students in the class
    (async () => {
      try {
        const students = await sequelize.query(
          `SELECT id FROM student_forms WHERE class_id = :classId AND school_id = :schoolId`,
          {
            replacements: { classId: finalClassId, schoolId: teacher.school_id },
            type: QueryTypes.SELECT
          }
        );
        const studentIds = students.map(s => s.id);
        if (studentIds.length > 0) {
          const payload = {
            title: "New Exam Timetable",
            body: `A new timetable for ${exam_type || 'Exam'} has been uploaded.`,
            data: { type: 'exam', id: result[0][0].id }
          };
          sendPushToUsers(studentIds, 'student', payload);
        }
      } catch (err) {
        console.error("Failed to send push notification for exam timetable", err);
      }
    })();

  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(200).json({
        success: false,
        message: "A timetable for this class already exists. Please edit the existing one."
      });
    }
    console.error("Create Timetable Error:", error);
    res.status(200).json({ success: false, message: "Could not create timetable. Please try again.", error: error.message });
  }
};

// ---------------- GET ALL ----------------
exports.getTimetables = async (req, res) => {
  try {
    const teacher = req.teacher;

    let classIds = [];
    if (teacher.class_id) classIds.push(teacher.class_id);

    // Find all classes assigned to this teacher using teacher_id
    const assigned = await sequelize.query(
      `SELECT DISTINCT class_id FROM divisions WHERE teacher_id = :teacher_id`,
      { replacements: { teacher_id: teacher.id }, type: QueryTypes.SELECT }
    );
    assigned.forEach(a => {
      if (!classIds.includes(a.class_id)) classIds.push(a.class_id);
    });

    if (classIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const timetables = await sequelize.query(
      `SELECT * FROM timetables
       WHERE class_id IN (:classIds) AND is_active = true
       ORDER BY created_at DESC`,
      {
        replacements: { classIds },
        type: QueryTypes.SELECT
      }
    );

    res.json({ success: true, data: timetables });

  } catch (error) {
    console.error("Get Timetables Error:", error);
    res.status(200).json({ success: false, message: "Unable to load timetables. Please try again.", error: error.message });
  }
};

// ---------------- GET ONE ----------------
exports.getTimetableById = async (req, res) => {
  try {
    const teacher = req.teacher;
    const { id } = req.params;

    const timetables = await sequelize.query(
      `SELECT t.* FROM timetables t
       JOIN divisions d ON d.class_id = t.class_id
       WHERE t.id = :id AND d.teacher_id = :teacher_id`,
      {
        replacements: { id, teacher_id: teacher.id },
        type: QueryTypes.SELECT
      }
    );

    if (timetables.length === 0) {
      return res.status(200).json({ success: false, message: "Timetable not found. It may have been deleted." });
    }

    res.json({ success: true, data: timetables[0] });

  } catch (error) {
    console.error("Get Timetable By ID Error:", error);
    res.status(200).json({ success: false, message: "Unable to load timetable details. Please try again.", error: error.message });
  }
};

// ---------------- UPDATE ----------------
exports.updateTimetable = async (req, res) => {
  try {
    const teacher = req.teacher;
    const { id } = req.params;

    const {
      title,
      exam_type,
      start_date,
      end_date,
      exam_schedule,
      is_active
    } = req.body;

    const timetable_file = req.file ? `/uploads/timetables/${req.file.filename}` : undefined;

    let schedule = undefined;
    if (exam_schedule) {
      schedule = typeof exam_schedule === "string" ? JSON.parse(exam_schedule) : exam_schedule;
    }

    const result = await sequelize.query(
      `UPDATE timetables SET
        title = COALESCE(:title, title),
        exam_type = COALESCE(:exam_type, exam_type),
        start_date = COALESCE(:start_date, start_date),
        end_date = COALESCE(:end_date, end_date),
        timetable_file = COALESCE(:timetable_file, timetable_file),
        exam_schedule = COALESCE(:exam_schedule, exam_schedule),
        is_active = COALESCE(:is_active, is_active)
       WHERE id = :id 
       AND class_id IN (
         SELECT d.class_id FROM divisions d
         WHERE d.teacher_id = :teacher_id
       )
       RETURNING *`,
      {
        replacements: {
          title: title || null,
          exam_type: exam_type || null,
          start_date: start_date || null,
          end_date: end_date || null,
          timetable_file: timetable_file || null,
          exam_schedule: schedule ? JSON.stringify(schedule) : null,
          is_active: is_active !== undefined ? is_active : null,
          id,
          teacher_id: teacher.id
        },
        type: QueryTypes.UPDATE
      }
    );

    if (result[0].length === 0) {
      return res.status(200).json({ success: false, message: "Timetable not found. It may have been deleted." });
    }

    res.json({
      success: true,
      message: "Timetable updated",
      data: result[0][0]
    });

  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(200).json({
        success: false,
        message: "A timetable with this exam type already exists for this class."
      });
    }
    console.error("Update Timetable Error:", error);
    res.status(200).json({ success: false, message: "Could not update timetable. Please try again.", error: error.message });
  }
};

// ---------------- DELETE ----------------
exports.deleteTimetable = async (req, res) => {
  try {
    const teacher = req.teacher;
    const { id } = req.params;

    const result = await sequelize.query(
      `DELETE FROM timetables
       WHERE id = :id 
       AND class_id IN (
         SELECT d.class_id FROM divisions d
         WHERE d.teacher_id = :teacher_id
       )
       RETURNING id`,
      {
        replacements: { id, teacher_id: teacher.id },
        type: QueryTypes.DELETE
      }
    );

    if (result[0].length === 0) {
      return res.status(200).json({ success: false, message: "Timetable not found. It may have been deleted." });
    }

    res.json({
      success: true,
      message: "Timetable deleted"
    });

  } catch (error) {
    console.error("Delete Timetable Error:", error);
    res.status(200).json({ success: false, message: "Could not delete timetable. Please try again.", error: error.message });
  }
};
