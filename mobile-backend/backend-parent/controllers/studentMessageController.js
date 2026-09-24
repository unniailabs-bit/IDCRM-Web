const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");
const { sendPushToUsers } = require("../../utils/pushNotification");

const STUDENT_TEACHER_LIST_SQL = `
WITH latest_per_teacher AS (
  SELECT DISTINCT ON (m.teacher_id)
    m.teacher_id,
    m.message AS last_message,
    m.sender_role AS last_sender_role,
    m.created_at
  FROM teacher_student_messages m
  WHERE m.student_id = :student_id
    AND m.school_id = :school_id
    AND m.class_id = :class_id
    AND m.division_id = :division_id
    AND (
      (SELECT d.teacher_id FROM divisions d WHERE d.id = :division_id LIMIT 1) IS NULL
      OR m.teacher_id = (SELECT d.teacher_id FROM divisions d WHERE d.id = :division_id LIMIT 1)
    )
  ORDER BY m.teacher_id, m.created_at DESC
)
SELECT
  t.id,
  t.name,
  t.email,
  l.last_message,
  l.last_sender_role,
  l.created_at,
  (
    SELECT COUNT(*)::int
    FROM teacher_student_messages um
    WHERE um.student_id = :student_id
      AND um.teacher_id = t.id
      AND um.sender_role = 'teacher'
      AND um.is_read = false
  ) AS unread_count
FROM latest_per_teacher l
JOIN teachers t ON t.id = l.teacher_id
ORDER BY unread_count DESC, l.created_at DESC NULLS LAST
`;

/**
 * GET TEACHERS FOR STUDENT (Messages list — used by Flutter APK)
 * Lists teachers who have an actual chat thread with this student.
 * Previously joined materials, which showed the wrong teacher/preview.
 */
exports.getTeachersForStudent = async (req, res) => {
  try {
    const student = req.student;

    if (!student || !student.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const teachers = await sequelize.query(STUDENT_TEACHER_LIST_SQL, {
      replacements: {
        student_id: student.id,
        school_id: student.school_id,
        class_id: student.class_id,
        division_id: student.division_id
      },
      type: QueryTypes.SELECT
    });

    return res.json({
      success: true,
      count: teachers.length,
      teachers
    });

  } catch (error) {
    console.error("Get Teachers Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * GET TEACHERS FOR STUDENT
 * (based on class + division from existing data)
 */
exports.getChatHistory = async (req, res) => {
  try {
    const student = req.student;
    const { teacher_id } = req.query;

    if (!student || !student.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!teacher_id) {
      return res.status(400).json({ success: false, message: "teacher_id is required" });
    }

    // Mark unread messages from this teacher as read
    await sequelize.query(
      `
      UPDATE teacher_student_messages 
      SET is_read = true 
      WHERE student_id = :student_id 
        AND teacher_id = :teacher_id 
        AND sender_role = 'teacher' 
        AND is_read = false
      `,
      {
        replacements: { student_id: student.id, teacher_id },
        type: QueryTypes.UPDATE
      }
    );

    const messages = await sequelize.query(
      `
      SELECT * FROM teacher_student_messages
      WHERE student_id = :student_id
        AND teacher_id = :teacher_id
        AND school_id = :school_id
        AND class_id = :class_id
        AND division_id = :division_id
      ORDER BY created_at ASC
      `,
      {
        replacements: {
          student_id: student.id,
          teacher_id,
          school_id: student.school_id,
          class_id: student.class_id,
          division_id: student.division_id
        },
        type: QueryTypes.SELECT
      }
    );

    return res.json({
      success: true,
      count: messages.length,
      messages
    });

  } catch (error) {
    console.error("Get Chat History Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET RECEIVED MESSAGES (STUDENT)
 * Shows all messages sent by teachers to this student
 */
exports.getReceivedMessages = async (req, res) => {
  try {
    const student = req.student;
    if (!student || !student.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const teachers = await sequelize.query(STUDENT_TEACHER_LIST_SQL, {
      replacements: {
        student_id: student.id,
        school_id: student.school_id,
        class_id: student.class_id,
        division_id: student.division_id
      },
      type: QueryTypes.SELECT
    });

    return res.json({
      success: true,
      count: teachers.length,
      teachers
    });
  } catch (error) {
    console.error("Get Received Messages Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * SEND MESSAGE (STUDENT → TEACHER)
 */
exports.sendMessageToTeacher = async (req, res) => {
  try {
    const student = req.student;
    const { teacher_id, message } = req.body;

    if (!student || !student.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (!teacher_id || !message) {
      return res.status(400).json({
        success: false,
        message: "teacher_id and message are required"
      });
    }

    const [teacher] = await sequelize.query(
      `SELECT id FROM teachers WHERE id = :teacher_id`,
      { replacements: { teacher_id }, type: QueryTypes.SELECT }
    );

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }

    const [studentStatus] = await sequelize.query(
      `SELECT messaging_enabled FROM student_forms WHERE id = :student_id`,
      { replacements: { student_id: student.id }, type: QueryTypes.SELECT }
    );

    const [existingThread] = await sequelize.query(
      `SELECT 1 FROM teacher_student_messages
       WHERE student_id = :student_id AND teacher_id = :teacher_id
       LIMIT 1`,
      { replacements: { student_id: student.id, teacher_id }, type: QueryTypes.SELECT }
    );

    if (
      studentStatus &&
      studentStatus.messaging_enabled === false &&
      !existingThread
    ) {
      return res.status(403).json({
        success: false,
        message: "Your messaging feature has been disabled by the teacher"
      });
    }

    await sequelize.query(
      `
      INSERT INTO teacher_student_messages
      (
        school_id,
        student_id,
        teacher_id,
        class_id,
        division_id,
        message,
        sender_role
      )
      VALUES
      (
        :school_id,
        :student_id,
        :teacher_id,
        :class_id,
        :division_id,
        :message,
        'student'
      )
      `,
      {
        replacements: {
          school_id: student.school_id,
          student_id: student.id,
          teacher_id,
          class_id: student.class_id,
          division_id: student.division_id,
          message
        }
      }
    );

    // --- 🚀 Send Push Notification to Teacher ---
    (async () => {
      try {
        // Use student name if available in req.student, else generic title
        const studentName = (student.first_name && student.last_name) 
          ? `${student.first_name} ${student.last_name}` 
          : "A Student";

        await sendPushToUsers([teacher_id], 'teacher', {
          title: `New message from ${studentName} 📩`,
          body: message.length > 50 ? message.substring(0, 47) + "..." : message,
          data: { type: "chat", student_id: String(student.id) }
        });
      } catch (pErr) {
        console.error("Push Notification Logic Error (Student -> Teacher Chat):", pErr);
      }
    })();
    // --------------------------------------------

    return res.json({
      success: true,
      message: "Message sent to teacher"
    });

  } catch (error) {
    console.error("Send Message Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
