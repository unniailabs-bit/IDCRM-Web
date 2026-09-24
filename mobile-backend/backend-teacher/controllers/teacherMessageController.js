const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");
const { sendPushToUsers } = require("../../utils/pushNotification");

/**
 * GET STUDENTS WITH MESSAGES
 * Returns a list of students who have messaged the teacher
 */
exports.getStudentsWithMessages = async (req, res) => {
    try {
        const teacher = req.teacher;

        if (!teacher || !teacher.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const students = await sequelize.query(
            `
      SELECT 
        s.id,
        s.first_name || ' ' || s.last_name as name,
        s.roll_number,
        s.messaging_enabled,
        s.class_id,
        c.class_name,
        s.division_id,
        d.division_name,
        s.father_name,
        s.father_phone,
        (
           SELECT message 
           FROM teacher_student_messages 
           WHERE student_id = s.id AND teacher_id = :teacher_id 
           ORDER BY created_at DESC 
           LIMIT 1
        ) AS last_message,
        (
           SELECT sender_role 
           FROM teacher_student_messages 
           WHERE student_id = s.id AND teacher_id = :teacher_id 
           ORDER BY created_at DESC 
           LIMIT 1
        ) AS last_sender_role,
        (
           SELECT created_at 
           FROM teacher_student_messages 
           WHERE student_id = s.id AND teacher_id = :teacher_id 
           ORDER BY created_at DESC 
           LIMIT 1
        ) AS created_at,
        (
           SELECT COUNT(*)::int 
           FROM teacher_student_messages 
           WHERE student_id = s.id 
             AND teacher_id = :teacher_id 
             AND sender_role = 'student' 
             AND is_read = false
        ) AS unread_count
      FROM student_forms s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN divisions d ON s.division_id = d.id
      WHERE EXISTS (
          SELECT 1 FROM teacher_student_messages 
          WHERE student_id = s.id AND teacher_id = :teacher_id
      )
      ORDER BY unread_count DESC, created_at DESC
      `,

            {
                replacements: { teacher_id: teacher.id },
                type: QueryTypes.SELECT
            }
        );

        return res.json({
            success: true,
            count: students.length,
            students
        });

    } catch (error) {
        console.error("Get Students with Messages Error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * GET CHAT HISTORY (TEACHER)
 */
exports.getChatHistory = async (req, res) => {
    try {
        const teacher = req.teacher;
        const { student_id } = req.params;

        if (!teacher || !teacher.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // Mark unread messages from this student as read
        await sequelize.query(
            `
      UPDATE teacher_student_messages 
      SET is_read = true 
      WHERE teacher_id = :teacher_id 
        AND student_id = :student_id 
        AND sender_role = 'student' 
        AND is_read = false
      `,
            {
                replacements: { teacher_id: teacher.id, student_id },
                type: QueryTypes.UPDATE
            }
        );

        const messages = await sequelize.query(
            `
      SELECT * FROM teacher_student_messages
      WHERE teacher_id = :teacher_id
        AND student_id = :student_id
      ORDER BY created_at ASC
      `,
            {
                replacements: { teacher_id: teacher.id, student_id },
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
 * REPLY TO STUDENT
 */
exports.replyToStudent = async (req, res) => {
    try {
        const teacher = req.teacher;
        const { student_id, message } = req.body;

        if (!teacher || !teacher.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (!student_id || !message) {
            return res.status(400).json({ success: false, message: "student_id and message are required" });
        }

        // Capture student details to keep message metadata consistent
        const [student] = await sequelize.query(
            `SELECT school_id, class_id, division_id FROM student_forms WHERE id = :student_id`,
            { replacements: { student_id }, type: QueryTypes.SELECT }
        );

        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
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
        'teacher'
      )
      `,
            {
                replacements: {
                    school_id: student.school_id,
                    student_id,
                    teacher_id: teacher.id,
                    class_id: student.class_id,
                    division_id: student.division_id,
                    message
                }
            }
        );

        await sequelize.query(
            `UPDATE student_forms SET messaging_enabled = true WHERE id = :student_id`,
            { replacements: { student_id }, type: QueryTypes.UPDATE }
        );

        // --- 🚀 Send Push Notification ---
        (async () => {
            try {
                await sendPushToUsers([student_id], 'student', {
                    title: `Message from Teacher 🧑‍🏫`,
                    body: message.length > 50 ? message.substring(0, 47) + "..." : message,
                    data: { type: "chat", teacher_id: String(teacher.id) }
                });
            } catch (pErr) {
                console.error("Push Notification Logic Error (Chat):", pErr);
            }
        })();
        // ---------------------------------
    
        return res.json({
            success: true,
            message: "Reply sent to student"
        });

    } catch (error) {
        console.error("Reply to Student Error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * GET ALL SENT MESSAGES (TEACHER)
 * Shows every message the teacher has ever sent
 */
exports.getSentMessages = async (req, res) => {
    try {
        const teacher = req.teacher;
        if (!teacher || !teacher.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const sentMessages = await sequelize.query(
            `
      SELECT m.*, s.first_name || ' ' || s.last_name as student_name
      FROM teacher_student_messages m
      JOIN student_forms s ON m.student_id = s.id
      WHERE m.teacher_id = :teacher_id AND m.sender_role = 'teacher'
      ORDER BY m.created_at DESC
      `,
            {
                replacements: { teacher_id: teacher.id },
                type: QueryTypes.SELECT
            }
        );

        return res.json({
            success: true,
            count: sentMessages.length,
            messages: sentMessages
        });
    } catch (error) {
        console.error("Get Sent Messages Error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * TOGGLE MESSAGING (TEACHER FOR STUDENT)
 */
exports.toggleMessaging = async (req, res) => {
    try {
        const teacher = req.teacher;
        const { student_id, enabled } = req.body;

        if (!teacher || !teacher.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (typeof enabled !== "boolean") {
            return res.status(400).json({ success: false, message: "enabled (boolean) is required" });
        }

        if (!student_id) {
            return res.status(400).json({ success: false, message: "student_id is required" });
        }

        await sequelize.query(
            `UPDATE student_forms SET messaging_enabled = :enabled WHERE id = :student_id`,
            {
                replacements: { enabled, student_id },
                type: QueryTypes.UPDATE
            }
        );

        return res.json({
            success: true,
            message: `Messaging ${enabled ? "enabled" : "disabled"} successfully for student`,
            messaging_enabled: enabled
        });
    } catch (error) {
        console.error("Toggle Messaging Error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * GET MESSAGING STATUS (TEACHER FOR STUDENT)
 */
exports.getMessagingStatus = async (req, res) => {
    try {
        const teacher = req.teacher;
        const { student_id } = req.query;

        if (!teacher || !teacher.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (!student_id) {
            return res.status(400).json({ success: false, message: "student_id is required" });
        }

        const [result] = await sequelize.query(
            `SELECT messaging_enabled FROM student_forms WHERE id = :student_id`,
            {
                replacements: { student_id },
                type: QueryTypes.SELECT
            }
        );

        return res.json({
            success: true,
            messaging_enabled: result ? result.messaging_enabled : false
        });
    } catch (error) {
        console.error("Get Messaging Status Error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
