const sequelize = require("../../config/db");
const path = require("path");
const { sendPushToUsers } = require("../../utils/pushNotification");
const { QueryTypes } = require("sequelize");

// Create Homework
exports.createHomework = async (req, res) => {
  try {
    const teacher = req.teacher; // extracted from JWT
    const { class_id, division_id, subject, assignment_title, description, due_date } = req.body;

    // Validate required fields
    if (!class_id || !division_id || !subject || !assignment_title || !due_date) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    // Handle file uploads (if any)
    let attachedFiles = [];
    if (req.files && req.files.length > 0) {
      attachedFiles = req.files.map(file => `/uploads/homework/${file.filename}`);
    }
    // Format files for PostgreSQL array
    const pgArray = `{${attachedFiles.map(f => `"${f}"`).join(",")}}`;

    // Insert into database
    const [result] = await sequelize.query(
      `INSERT INTO homework
       (class_id, division_id, teacher_id, subject, assignment_title, description, due_date, attached_files)
       VALUES (:class_id, :division_id, :teacher_id, :subject, :title, :description, :due_date, :files)
       RETURNING *`,
      {
        replacements: {
          class_id,
          division_id,
          teacher_id: teacher.id,
          subject,
          title: assignment_title,
          description,
          due_date,
          files: pgArray
        },
        type: sequelize.QueryTypes.INSERT
      }
    );

    res.json({ success: true, message: "Homework created successfully", homework: result[0] });
    
    // --- 🚀 Send Push Notification ---
    (async () => {
      try {
        const students = await sequelize.query(
          `SELECT id FROM student_forms WHERE class_id = :class_id AND division_id = :division_id`,
          { replacements: { class_id, division_id }, type: QueryTypes.SELECT }
        );
        const studentIds = students.map(s => s.id);

        if (studentIds.length > 0) {
          await sendPushToUsers(studentIds, 'student', {
            title: "New Homework Assigned 📝",
            body: `${subject}: ${assignment_title}`,
            data: { type: "homework", class_id: String(class_id), division_id: String(division_id) }
          });
        }
      } catch (pErr) {
        console.error("Push Notification Logic Error (Homework):", pErr);
      }
    })();
    // ---------------------------------

  } catch (err) {
    console.error("Create Homework Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// Get teacher's classes and divisions
exports.getTeacherClasses = async (req, res) => {
  try {
    const teacherId = req.teacher.id;

    // Fetch teacher name (for frontend display)
    const [teacher] = await sequelize.query(
      `SELECT name FROM teachers WHERE id = :teacherId`,
      {
        replacements: { teacherId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    const teacherName = teacher.name;

    // Fetch divisions using teacher_id
    const divisions = await sequelize.query(
      `SELECT id AS division_id, division_name, class_id, class_name
       FROM divisions
       WHERE teacher_id = :teacherId`,
      {
        replacements: { teacherId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    res.json({ success: true, teacher: teacherName, divisions });

  } catch (error) {
    console.error("Get Teacher Classes Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
