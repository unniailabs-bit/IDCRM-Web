const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");
const { sendPushToUsers } = require("../../utils/pushNotification");
// Test commit
/**
 * ======================================
 * GET STUDENTS FOR ATTENDANCE
 * Only APPROVED students of logged-in teacher
 * ======================================
 */
exports.getStudentsForAttendance = async (req, res) => {
  try {
    const teacher = req.teacher;

    const students = await sequelize.query(
      `
      SELECT
        sf.id AS student_id,
        sf.first_name,
        sf.last_name,
        sf.father_name,
        sf.father_phone,
        sf.roll_number,
        sf.class_id,
        sf.division_id,
        sf.messaging_enabled,
        c.class_name,
        d.division_name
      FROM student_forms sf
      LEFT JOIN classes c ON sf.class_id = c.id
      LEFT JOIN divisions d ON sf.division_id = d.id
      WHERE
        sf.division_id IN (SELECT id FROM divisions WHERE teacher_id = :teacher_id)
        AND sf.school_id = :school_id
      ORDER BY sf.class_id, sf.division_id, sf.roll_number
      `,
      {
        replacements: {
          teacher_id: teacher.id,
          school_id: teacher.school_id
        },
        type: QueryTypes.SELECT
      }
    );

    return res.json({
      success: true,
      students
    });

  } catch (error) {
    console.error("Get Students For Attendance Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch students"
    });
  }
};


/**
 * ======================================
 * MARK / UPDATE ATTENDANCE
 * ======================================
 */
exports.markAttendance = async (req, res) => {
  try {
    const teacher = req.teacher;
    const { date, attendance } = req.body;

    if (!date || !Array.isArray(attendance) || attendance.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance data"
      });
    }

    // 🔹 Step 0: Check School Calendar (Holiday Check)
    console.log(`[MarkAttendance] Checking Date: ${date}, School: ${teacher.school_id}`);

    const [calendarEntry] = await sequelize.query(
      `SELECT title, type, is_attendance_required 
       FROM school_calendar 
       WHERE school_id = :school_id 
         AND calendar_date = :date 
         AND is_active = true
      `,
      {
        replacements: {
          school_id: teacher.school_id,
          date
        },
        type: QueryTypes.SELECT
      }
    );

    console.log("[MarkAttendance] Calendar Entry:", calendarEntry);

    // Check if entry exists AND attendance is NOT required
    // using !is_attendance_required handles false, 0, null
    if (calendarEntry && !calendarEntry.is_attendance_required) {
      return res.status(400).json({
        success: false,
        message: `Cannot mark attendance: ${date} is ${calendarEntry.title} (${calendarEntry.type})`
      });
    }

    // 🔹 Step 1: Fetch class & division of students (safety check)
    const studentIds = attendance.map(a => a.student_id);

    const students = await sequelize.query(
      `
      SELECT id, class_id, division_id, first_name, last_name
      FROM student_forms
      WHERE id IN (:studentIds)
        AND division_id IN (SELECT id FROM divisions WHERE teacher_id = :teacher_id)
      `,
      {
        replacements: {
          studentIds,
          teacher_id: teacher.id
        },
        type: QueryTypes.SELECT
      }
    );

    if (!students.length) {
      return res.status(403).json({
        success: false,
        message: "No valid students found for attendance"
      });
    }

    // 🔹 Step 2: Create map for fast lookup
    const studentMap = {};
    students.forEach(s => {
      studentMap[s.id] = s;
    });

    // 🔹 Step 3: Prepare bulk insert data
    const insertData = [];

    attendance.forEach(item => {
      const student = studentMap[item.student_id];
      if (!student) return;

      insertData.push({
        student_id: item.student_id,
        class_id: student.class_id,
        division_id: student.division_id,
        date,
        status: item.status,
        marked_by: teacher.id
      });
    });

    if (!insertData.length) {
      return res.status(400).json({
        success: false,
        message: "No valid attendance records"
      });
    }

    // Step 4: Bulk insert / update attendance
    // Note: We use NOW() for created_at if it's a new record
    await sequelize.query(
      `
      INSERT INTO attendance
      (student_id, class_id, division_id, date, status, marked_by, created_at)
      VALUES
      ${insertData.map(
        (_, i) =>
          `(:student_id_${i}, :class_id_${i}, :division_id_${i}, :date_${i}, :status_${i}, :marked_by_${i}, NOW())`
      ).join(",")}
      ON CONFLICT (student_id, date)
      DO UPDATE SET
        status = EXCLUDED.status,
        marked_by = EXCLUDED.marked_by,
        created_at = NOW()
      `,
      {
        replacements: insertData.reduce((acc, row, i) => {
          acc[`student_id_${i}`] = row.student_id;
          acc[`class_id_${i}`] = row.class_id;
          acc[`division_id_${i}`] = row.division_id;
          acc[`date_${i}`] = row.date;
          acc[`status_${i}`] = row.status;
          acc[`marked_by_${i}`] = row.marked_by;
          return acc;
        }, {})
      }
    );

    // 🚀 Reset Read Status: Delete from notification_reads so parents see it as NEW
    await sequelize.query(
      `DELETE FROM notification_reads 
       WHERE entity_type = 'attendance' 
       AND entity_id IN (
         SELECT id FROM attendance WHERE student_id IN (:studentIds) AND date = :date
       )`,
      { replacements: { studentIds, date } }
    );

    // 🚀 Send Notifications in background
    (async () => {
      attendance.forEach(item => {
        const student = studentMap[item.student_id];
        if (!student) return;
        
        const payload = {
          title: "Attendance Update",
          body: `${student.first_name || 'Your child'} is ${item.status === 'present' ? 'Present' : 'Absent'} today.`,
          data: { type: 'attendance', status: item.status, date }
        };

        sendPushToUsers([item.student_id], 'student', payload);
      });
    })();

    return res.json({
      success: true,
      message: "Attendance marked successfully"
    });

  } catch (error) {
    console.error("Mark Attendance Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark attendance"
    });
  }
};
/**
 * ======================================
 * PATCH ATTENDANCE (UPDATE SINGLE STUDENT)
 * ======================================
 * Body:
 * {
 *   student_id: 22,
 *   date: "2026-01-02",
 *   status: "present" | "absent"
 * }
 */
exports.updateAttendance = async (req, res) => {
  try {
    const teacher = req.teacher;
    const { student_id, date, status } = req.body;

    if (!student_id || !date || !["present", "absent"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid data"
      });
    }

    // 🔹 Step 0: Check School Calendar (Holiday Check)
    console.log(`[UpdateAttendance] Checking Date: ${date}, School: ${teacher.school_id}`);

    const [calendarEntry] = await sequelize.query(
      `SELECT title, type, is_attendance_required 
       FROM school_calendar 
       WHERE school_id = :school_id 
         AND calendar_date = :date 
         AND is_active = true
      `,
      {
        replacements: {
          school_id: teacher.school_id,
          date
        },
        type: QueryTypes.SELECT
      }
    );

    console.log("[UpdateAttendance] Calendar Entry:", calendarEntry);

    if (calendarEntry && !calendarEntry.is_attendance_required) {
      return res.status(400).json({
        success: false,
        message: `Cannot update attendance: ${date} is ${calendarEntry.title} (${calendarEntry.type})`
      });
    }

    // 🔹 Verify student belongs to teacher
    const student = await sequelize.query(
      `
      SELECT id, class_id, division_id
      FROM student_forms
      WHERE id = :student_id
        AND division_id IN (SELECT id FROM divisions WHERE teacher_id = :teacher_id)
      `,
      {
        replacements: {
          student_id,
          teacher_id: teacher.id
        },
        type: QueryTypes.SELECT
      }
    );

    if (!student.length) {
      return res.status(403).json({
        success: false,
        message: "Student not allowed"
      });
    }

    const { class_id, division_id } = student[0];

    // 🔹 Update attendance
    await sequelize.query(
      `
      UPDATE attendance
      SET
        status = :status,
        marked_by = :teacher_id,
        created_at = NOW()
      WHERE
        student_id = :student_id
        AND date = :date
      `,
      {
        replacements: {
          student_id,
          date,
          status,
          teacher_id: teacher.id
        },
        type: QueryTypes.UPDATE
      }
    );

    // If no attendance existed earlier (this is redundant since we use UPDATE/INSERT flow, but keeping safety)
    // Actually the existing code had a check, let's just make sure it's correct.

    // 🚀 Reset Read Status: Delete from notification_reads so parents see it as NEW
    await sequelize.query(
      `DELETE FROM notification_reads 
       WHERE entity_type = 'attendance' 
       AND entity_id IN (
         SELECT id FROM attendance WHERE student_id = :student_id AND date = :date
       )`,
      { replacements: { student_id, date } }
    );

    // 🚀 Send Notification
    (async () => {
      const payload = {
        title: "Attendance Update",
        body: `${student[0].first_name || 'Your child'} is ${status === 'present' ? 'Present' : 'Absent'} today.`,
        data: { type: 'attendance', status, date }
      };
      sendPushToUsers([student_id], 'student', payload);
    })();

    return res.json({
      success: true,
      message: "Attendance updated successfully"
    });

  } catch (error) {
    console.error("Update Attendance Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update attendance"
    });
  }
};

/**
 * ======================================
 * GET ATTENDANCE STATUS (PRESENT / ABSENT)
 * ======================================
 * Query:
 * ?date=YYYY-MM-DD
 */
exports.getAttendanceStatus = async (req, res) => {
  try {
    const teacher = req.teacher;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required"
      });
    }

    const records = await sequelize.query(
      `
      SELECT
        sf.id AS student_id,
        sf.first_name,
        sf.last_name,
        sf.father_name,
        sf.father_phone,
        sf.roll_number,
        sf.class_id,
        sf.division_id,
        sf.messaging_enabled,
        c.class_name,
        d.division_name,
        COALESCE(a.status, 'not_marked') AS attendance_status
      FROM student_forms sf
      LEFT JOIN classes c ON sf.class_id = c.id
      LEFT JOIN divisions d ON sf.division_id = d.id
      LEFT JOIN attendance a
        ON a.student_id = sf.id
        AND a.date = :date
      WHERE
        sf.division_id IN (SELECT id FROM divisions WHERE teacher_id = :teacher_id)
        AND sf.school_id = :school_id
      ORDER BY sf.roll_number
      `,
      {
        replacements: {
          date,
          teacher_id: teacher.id,
          school_id: teacher.school_id
        },
        type: QueryTypes.SELECT
      }
    );

    return res.json({
      success: true,
      date,
      students: records
    });

  } catch (error) {
    console.error("Get Attendance Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch attendance status"
    });
  }
};
