const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");

/**
 * GET ALL EXAMS for Student
 */
exports.getStudentExams = async (req, res) => {
  try {
    const student = req.student;

    if (!student || !student.class_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized student"
      });
    }

    const exams = await sequelize.query(
      `SELECT id, title, exam_type, start_date, end_date, timetable_file
       FROM timetables
       WHERE class_id = :class_id
       AND is_active = true
       ORDER BY start_date ASC`,
      {
        replacements: { class_id: student.class_id },
        type: QueryTypes.SELECT
      }
    );

    res.json({
      success: true,
      data: exams
    });

  } catch (error) {
    console.error("Student Get Exams Error:", error);
    res.status(200).json({
      success: false,
      message: "Unable to load exams. Please try again."
    });
  }
};

/**
 * GET SINGLE EXAM + EXAM SCHEDULE
 */
exports.getStudentExamById = async (req, res) => {
  try {
    const student = req.student;
    const { id } = req.params;

    const exam = await sequelize.query(
      `SELECT id, title, exam_type, start_date, end_date, timetable_file, exam_schedule
       FROM timetables
       WHERE id = :id
       AND class_id = :class_id
       AND is_active = true`,
      {
        replacements: {
          id,
          class_id: student.class_id
        },
        type: QueryTypes.SELECT
      }
    );

    if (exam.length === 0) {
      return res.status(200).json({
        success: false,
        message: "Exam not found. It may have been removed."
      });
    }

    res.json({
      success: true,
      data: exam[0]
    });

  } catch (error) {
    console.error("Student Get Exam By ID Error:", error);
    res.status(200).json({
      success: false,
      message: "Unable to load exam details. Please try again."
    });
  }
};
