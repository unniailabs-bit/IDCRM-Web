const { QueryTypes } = require("sequelize");
const sequelize = require("../../config/db");
const { sendPushToUsers } = require("../../utils/pushNotification");

/**
 * ======================================
 * GET TEACHER ASSIGNED CLASSES / DIVISIONS
 * ======================================
 */
exports.getTeacherClasses = async (req, res) => {
    try {
        const teacherId = req.user?.id;

        if (!teacherId) {
            return res.status(400).json({ success: false, message: "Teacher ID missing in token" });
        }

        const divisions = await sequelize.query(
            `SELECT 
         d.id AS division_id, 
         d.division_name, 
         d.class_name, 
         d.class_id,
         COUNT(sf.id) AS student_count
       FROM divisions d
       LEFT JOIN student_forms sf ON sf.division_id = d.id AND sf.status = 'approved'
       WHERE d.teacher_id = :teacherId
       GROUP BY d.id, d.division_name, d.class_name, d.class_id
       ORDER BY d.class_id, d.division_name`,
            { replacements: { teacherId }, type: QueryTypes.SELECT }
        );

        return res.json({
            success: true,
            data: divisions
        });
    } catch (error) {
        console.error("🔥 Error in getTeacherClasses:", error);
        return res.status(500).json({ success: false, message: error.message || "Failed to fetch teacher classes" });
    }
};

/**
 * ======================================
 * GET STUDENTS FOR ATTENDANCE
 * Returns approved students for teacher's division
 * ======================================
 */
exports.getStudentsForAttendance = async (req, res) => {
    try {
        const teacherId = req.user?.id;
        const { division_id } = req.query;

        let divisionFilter = "sf.division_id IN (SELECT id FROM divisions WHERE teacher_id = :teacherId)";
        const replacements = { teacherId };

        if (division_id && division_id !== 'all') {
            divisionFilter = "sf.division_id = :division_id AND sf.division_id IN (SELECT id FROM divisions WHERE teacher_id = :teacherId)";
            replacements.division_id = division_id;
        }

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
        c.class_name,
        d.division_name
      FROM student_forms sf
      LEFT JOIN classes c ON sf.class_id = c.id
      LEFT JOIN divisions d ON sf.division_id = d.id
      WHERE
        ${divisionFilter}
        AND sf.status = 'approved'
      ORDER BY sf.class_id, sf.division_id, sf.roll_number, sf.first_name
      `,
            { replacements, type: QueryTypes.SELECT }
        );

        return res.json({
            success: true,
            students
        });
    } catch (error) {
        console.error("🔥 Error in getStudentsForAttendance:", error);
        return res.status(500).json({ success: false, message: error.message || "Failed to fetch students" });
    }
};

/**
 * ======================================
 * GET ATTENDANCE STATUS FOR A SINGLE DATE
 * ======================================
 */
exports.getAttendanceStatus = async (req, res) => {
    try {
        const teacherId = req.user?.id;
        const { date, division_id } = req.query;

        if (!date) {
            return res.status(400).json({ success: false, message: "Date is required" });
        }

        let divisionFilter = "sf.division_id IN (SELECT id FROM divisions WHERE teacher_id = :teacherId)";
        const replacements = { date, teacherId };

        if (division_id && division_id !== 'all') {
            divisionFilter = "sf.division_id = :division_id AND sf.division_id IN (SELECT id FROM divisions WHERE teacher_id = :teacherId)";
            replacements.division_id = division_id;
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
        c.class_name,
        d.division_name,
        COALESCE(a.status, 'not_marked') AS attendance_status
      FROM student_forms sf
      LEFT JOIN classes c ON sf.class_id = c.id
      LEFT JOIN divisions d ON sf.division_id = d.id
      LEFT JOIN attendance a
        ON a.student_id = sf.id
        AND a.date::text = :date
      WHERE
        ${divisionFilter}
        AND sf.status = 'approved'
      ORDER BY sf.class_id, sf.division_id, sf.roll_number, sf.first_name
      `,
            { replacements, type: QueryTypes.SELECT }
        );

        const summary = {
            total: records.length,
            present: records.filter(r => r.attendance_status === 'present').length,
            absent: records.filter(r => r.attendance_status === 'absent').length,
            not_marked: records.filter(r => r.attendance_status === 'not_marked').length,
        };

        return res.json({
            success: true,
            date,
            students: records,
            summary
        });
    } catch (error) {
        console.error("🔥 Error in getAttendanceStatus:", error);
        return res.status(500).json({ success: false, message: error.message || "Failed to fetch attendance status" });
    }
};

/**
 * ======================================
 * GET MONTHLY ATTENDANCE REGISTER MATRIX
 * Query: ?month=YYYY-MM&division_id=X
 * ======================================
 */
exports.getAttendanceRegister = async (req, res) => {
    try {
        const teacherId = req.user?.id;
        let { month, division_id } = req.query;

        if (!month) {
            const today = new Date();
            const year = today.getFullYear();
            const m = String(today.getMonth() + 1).padStart(2, '0');
            month = `${year}-${m}`;
        }

        const [yearStr, monthStr] = month.split('-');
        const year = parseInt(yearStr, 10);
        const monthNum = parseInt(monthStr, 10);

        const startDate = `${month}-01`;
        const lastDayNum = new Date(year, monthNum, 0).getDate();
        const endDate = `${month}-${String(lastDayNum).padStart(2, '0')}`;

        let divisionFilter = "sf.division_id IN (SELECT id FROM divisions WHERE teacher_id = :teacherId)";
        const replacements = { teacherId, startDate, endDate };

        if (division_id && division_id !== 'all') {
            divisionFilter = "sf.division_id = :division_id AND sf.division_id IN (SELECT id FROM divisions WHERE teacher_id = :teacherId)";
            replacements.division_id = division_id;
        }

        // 1. Fetch Students
        const students = await sequelize.query(
            `
      SELECT
        sf.id AS student_id,
        sf.first_name,
        sf.last_name,
        sf.roll_number,
        sf.class_id,
        sf.division_id,
        c.class_name,
        d.division_name
      FROM student_forms sf
      LEFT JOIN classes c ON sf.class_id = c.id
      LEFT JOIN divisions d ON sf.division_id = d.id
      WHERE
        ${divisionFilter}
        AND sf.status = 'approved'
      ORDER BY sf.class_id, sf.division_id, sf.roll_number, sf.first_name
      `,
            { replacements, type: QueryTypes.SELECT }
        );

        // 2. Fetch Attendance Records for the Month
        const attendanceRecords = await sequelize.query(
            `
      SELECT
        a.student_id,
        TO_CHAR(a.date, 'YYYY-MM-DD') AS date,
        a.status
      FROM attendance a
      JOIN student_forms sf ON a.student_id = sf.id
      WHERE
        ${divisionFilter}
        AND a.date >= :startDate::date AND a.date <= :endDate::date
      `,
            { replacements, type: QueryTypes.SELECT }
        );

        // 3. Fetch Holidays / Calendar entries (optional)
        let calendarEntries = [];
        try {
            calendarEntries = await sequelize.query(
                `
        SELECT 
          TO_CHAR(calendar_date, 'YYYY-MM-DD') AS date,
          title,
          type,
          is_attendance_required
        FROM school_calendar
        WHERE calendar_date >= :startDate::date AND calendar_date <= :endDate::date
          AND is_active = true
        `,
                { replacements: { startDate, endDate }, type: QueryTypes.SELECT }
            );
        } catch (e) {
            console.warn("School calendar query skipped:", e.message);
        }

        // Map records by key: "student_id_YYYY-MM-DD" -> status
        const recordsMap = {};
        attendanceRecords.forEach(r => {
            recordsMap[`${r.student_id}_${r.date}`] = r.status;
        });

        const holidaysMap = {};
        calendarEntries.forEach(h => {
            holidaysMap[h.date] = h;
        });

        return res.json({
            success: true,
            month,
            daysInMonth: lastDayNum,
            students,
            attendanceMap: recordsMap,
            holidaysMap
        });

    } catch (error) {
        console.error("🔥 Error in getAttendanceRegister:", error);
        return res.status(500).json({ success: false, message: error.message || "Failed to fetch attendance register" });
    }
};

/**
 * ======================================
 * MARK / BULK UPDATE ATTENDANCE
 * If date < today → creates pending edit requests (requires school admin approval)
 * If date == today → saves directly as before
 * ======================================
 */
exports.markAttendance = async (req, res) => {
    try {
        const teacherId = req.user?.id;
        const { date, attendance, note } = req.body;

        if (!date || !Array.isArray(attendance) || attendance.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid attendance data provided" });
        }

        // Determine today's date string (YYYY-MM-DD)
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const isPastDate = date < todayStr;

        // Check School Calendar
        try {
            const [calendarEntry] = await sequelize.query(
                `SELECT title, type, is_attendance_required 
         FROM school_calendar 
         WHERE calendar_date = :date::date 
           AND is_active = true`,
                { replacements: { date }, type: QueryTypes.SELECT }
            );

            if (calendarEntry && !calendarEntry.is_attendance_required) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot mark attendance: ${date} is ${calendarEntry.title} (${calendarEntry.type})`
                });
            }
        } catch (e) {
            // ignore
        }

        const studentIds = attendance.map(a => a.student_id);

        const students = await sequelize.query(
            `SELECT sf.id, sf.class_id, sf.division_id, sf.first_name, sf.last_name,
                    COALESCE(sf.school_id, c.school_id) AS school_id
       FROM student_forms sf
       JOIN divisions d ON sf.division_id = d.id
       LEFT JOIN classes c ON sf.class_id = c.id
       WHERE sf.id IN (:studentIds)
         AND sf.division_id IN (SELECT id FROM divisions WHERE teacher_id = :teacherId)`,
            { replacements: { studentIds, teacherId }, type: QueryTypes.SELECT }
        );

        if (!students.length) {
            return res.status(403).json({ success: false, message: "No valid students found for attendance marking" });
        }

        const studentMap = {};
        students.forEach(s => { studentMap[s.id] = s; });

        // ── PAST DATE → submit edit requests for approval ──────────────────────
        if (isPastDate) {
            // Fetch existing attendance for these students on this date
            const existingRecords = await sequelize.query(
                `SELECT student_id, status FROM attendance
         WHERE student_id IN (:studentIds) AND date::text = :date`,
                { replacements: { studentIds, date }, type: QueryTypes.SELECT }
            );
            const existingMap = {};
            existingRecords.forEach(r => { existingMap[r.student_id] = r.status; });

            // Build upsert values for edit requests
            const requestItems = [];
            attendance.forEach(item => {
                const s = studentMap[item.student_id];
                if (!s) return;
                requestItems.push({
                    teacher_id: teacherId,
                    student_id: item.student_id,
                    division_id: s.division_id,
                    class_id: s.class_id,
                    school_id: s.school_id,
                    attendance_date: date,
                    current_status: existingMap[item.student_id] || null,
                    requested_status: item.status,
                    teacher_note: note || null
                });
            });

            if (!requestItems.length) {
                return res.status(400).json({ success: false, message: "No valid edit requests to submit" });
            }

            // Upsert: if a pending request already exists for same student+date, update it
            await sequelize.query(
                `
        INSERT INTO attendance_edit_requests
        (teacher_id, student_id, division_id, class_id, school_id, attendance_date,
         current_status, requested_status, teacher_note, status, created_at, updated_at)
        VALUES
        ${requestItems.map((_, i) =>
                    `(:teacher_id_${i}, :student_id_${i}, :division_id_${i}, :class_id_${i}, :school_id_${i},
           :date_${i}, :current_status_${i}, :requested_status_${i}, :note_${i}, 'pending', NOW(), NOW())`
                ).join(',')}
        ON CONFLICT (student_id, attendance_date) WHERE status = 'pending'
        DO UPDATE SET
          requested_status = EXCLUDED.requested_status,
          teacher_note     = EXCLUDED.teacher_note,
          updated_at       = NOW()
        `,
                {
                    replacements: requestItems.reduce((acc, row, i) => {
                        acc[`teacher_id_${i}`] = row.teacher_id;
                        acc[`student_id_${i}`] = row.student_id;
                        acc[`division_id_${i}`] = row.division_id;
                        acc[`class_id_${i}`] = row.class_id;
                        acc[`school_id_${i}`] = row.school_id;
                        acc[`date_${i}`] = row.attendance_date;
                        acc[`current_status_${i}`] = row.current_status;
                        acc[`requested_status_${i}`] = row.requested_status;
                        acc[`note_${i}`] = row.teacher_note;
                        return acc;
                    }, {})
                }
            );

            return res.json({
                success: true,
                pending_approval: true,
                message: `Edit request submitted for ${requestItems.length} student(s). Awaiting School Admin approval.`
            });
        }

        // ── TODAY → save directly ──────────────────────────────────────────────
        const insertData = [];
        attendance.forEach(item => {
            const s = studentMap[item.student_id];
            if (!s) return;
            insertData.push({
                student_id: item.student_id,
                class_id: s.class_id,
                division_id: s.division_id,
                date,
                status: item.status,
                marked_by: teacherId
            });
        });

        if (!insertData.length) {
            return res.status(400).json({ success: false, message: "No valid attendance records to process" });
        }

        await sequelize.query(
            `
      INSERT INTO attendance
      (student_id, class_id, division_id, date, status, marked_by, created_at)
      VALUES
      ${insertData.map((_, i) =>
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

        // Reset parent notifications if notification_reads table exists
        await sequelize.query(
            `DELETE FROM notification_reads 
       WHERE entity_type = 'attendance' 
       AND entity_id IN (
         SELECT id FROM attendance WHERE student_id IN (:studentIds) AND date::text = :date
       )`,
            { replacements: { studentIds, date } }
        ).catch(() => { });

        // Send push notifications
        (async () => {
            attendance.forEach(item => {
                const student = studentMap[item.student_id];
                if (!student) return;
                const payload = {
                    title: "Attendance Update",
                    body: `${student.first_name || 'Your child'} was marked ${item.status === 'present' ? 'Present' : 'Absent'} on ${date}.`,
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
        console.error("🔥 Error in markAttendance:", error);
        return res.status(500).json({ success: false, message: error.message || "Failed to mark attendance" });
    }
};

/**
 * ======================================
 * UPDATE SINGLE STUDENT ATTENDANCE
 * If date < today → creates a pending edit request
 * If date == today → saves directly
 * ======================================
 */
exports.updateAttendance = async (req, res) => {
    try {
        const teacherId = req.user?.id;
        const { student_id, date, status, note } = req.body;

        if (!student_id || !date || !["present", "absent"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid parameters provided" });
        }

        // Determine today's date string
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const isPastDate = date < todayStr;

        const students = await sequelize.query(
            `SELECT sf.id, sf.class_id, sf.division_id, sf.first_name, sf.last_name,
                    COALESCE(sf.school_id, c.school_id) AS school_id
       FROM student_forms sf
       JOIN divisions d ON sf.division_id = d.id
       LEFT JOIN classes c ON sf.class_id = c.id
       WHERE sf.id = :student_id
         AND sf.division_id IN (SELECT id FROM divisions WHERE teacher_id = :teacherId)`,
            { replacements: { student_id, teacherId }, type: QueryTypes.SELECT }
        );

        if (!students.length) {
            return res.status(403).json({ success: false, message: "Student not assigned to teacher" });
        }

        const student = students[0];

        // ── PAST DATE → create edit request ────────────────────────────────────
        if (isPastDate) {
            // Fetch current attendance status
            const [existing] = await sequelize.query(
                `SELECT status FROM attendance WHERE student_id = :student_id AND date::text = :date`,
                { replacements: { student_id, date }, type: QueryTypes.SELECT }
            );

            await sequelize.query(
                `INSERT INTO attendance_edit_requests
         (teacher_id, student_id, division_id, class_id, school_id, attendance_date,
          current_status, requested_status, teacher_note, status, created_at, updated_at)
         VALUES
         (:teacher_id, :student_id, :division_id, :class_id, :school_id,
          :date, :current_status, :requested_status, :note, 'pending', NOW(), NOW())
         ON CONFLICT (student_id, attendance_date) WHERE status = 'pending'
         DO UPDATE SET
           requested_status = EXCLUDED.requested_status,
           teacher_note     = EXCLUDED.teacher_note,
           updated_at       = NOW()`,
                {
                    replacements: {
                        teacher_id: teacherId,
                        student_id,
                        division_id: student.division_id,
                        class_id: student.class_id,
                        school_id: student.school_id,
                        date,
                        current_status: existing?.status || null,
                        requested_status: status,
                        note: note || null
                    }
                }
            );

            return res.json({
                success: true,
                pending_approval: true,
                message: "Edit request submitted. Awaiting School Admin approval."
            });
        }

        // ── TODAY → save directly ───────────────────────────────────────────────
        await sequelize.query(
            `
      INSERT INTO attendance (student_id, class_id, division_id, date, status, marked_by, created_at)
      VALUES (:student_id, :class_id, :division_id, :date, :status, :marked_by, NOW())
      ON CONFLICT (student_id, date)
      DO UPDATE SET
        status = EXCLUDED.status,
        marked_by = EXCLUDED.marked_by,
        created_at = NOW()
      `,
            {
                replacements: {
                    student_id,
                    class_id: student.class_id,
                    division_id: student.division_id,
                    date,
                    status,
                    marked_by: teacherId
                }
            }
        );

        return res.json({
            success: true,
            message: "Attendance updated successfully"
        });

    } catch (error) {
        console.error("🔥 Error in updateAttendance:", error);
        return res.status(500).json({ success: false, message: error.message || "Failed to update attendance" });
    }
};

/**
 * ======================================
 * GET TEACHER'S OWN EDIT REQUESTS
 * Returns pending/resolved requests so teacher can see what's "awaiting approval"
 * ======================================
 */
exports.getTeacherEditRequests = async (req, res) => {
    try {
        const teacherId = req.user?.id;
        const { status, division_id, month } = req.query;

        let filters = `aer.teacher_id = :teacherId`;
        const replacements = { teacherId };

        if (status) {
            filters += ` AND aer.status = :status`;
            replacements.status = status;
        }
        if (division_id && division_id !== 'all') {
            filters += ` AND aer.division_id = :division_id`;
            replacements.division_id = division_id;
        }
        if (month) {
            filters += ` AND TO_CHAR(aer.attendance_date, 'YYYY-MM') = :month`;
            replacements.month = month;
        }

        const requests = await sequelize.query(
            `SELECT
         aer.id,
         aer.student_id,
         sf.first_name,
         sf.last_name,
         sf.roll_number,
         aer.division_id,
         d.division_name,
         c.class_name,
         TO_CHAR(aer.attendance_date, 'YYYY-MM-DD') AS attendance_date,
         aer.current_status,
         aer.requested_status,
         aer.status,
         aer.teacher_note,
         aer.admin_note,
         aer.reviewed_at,
         aer.created_at
       FROM attendance_edit_requests aer
       JOIN student_forms sf ON aer.student_id = sf.id
       JOIN divisions d ON aer.division_id = d.id
       LEFT JOIN classes c ON aer.class_id = c.id
       WHERE ${filters}
       ORDER BY aer.created_at DESC`,
            { replacements, type: QueryTypes.SELECT }
        );

        return res.json({ success: true, data: requests });
    } catch (error) {
        console.error("🔥 Error in getTeacherEditRequests:", error);
        return res.status(500).json({ success: false, message: error.message || "Failed to fetch edit requests" });
    }
};
