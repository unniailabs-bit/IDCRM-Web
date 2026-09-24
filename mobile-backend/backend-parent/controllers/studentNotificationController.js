const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");

function getAppBaseUrl(req) {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.replace(/\/$/, "");
  }
  if (req) {
    return `${req.protocol}://${req.get("host")}`;
  }
  return (process.env.MEDIA_STORAGE_URL || "").replace(/\/$/, "");
}

function normalizeMediaPath(filePath) {
  if (!filePath) return null;
  let normalized = String(filePath).replace(/\\/g, "/");
  const uploadsIndex = normalized.indexOf("uploads/");
  if (uploadsIndex >= 0) {
    normalized = normalized.substring(uploadsIndex);
  }
  return normalized.replace(/^\/+/, "");
}

function buildMediaUrl(storedPath, req, useStorageUrl = false) {
  const normalized = normalizeMediaPath(storedPath);
  if (!normalized) return null;
  const base = useStorageUrl
    ? (process.env.MEDIA_STORAGE_URL || "").replace(/\/$/, "")
    : getAppBaseUrl(req);
  if (!base) return `/${normalized}`;
  return `${base}/${normalized}`;
}

/**
 * GET - Aggregate Student Notifications
 * Fetches recent updates with per-student is_read status
 */
exports.getNotifications = async (req, res) => {
  try {
    const student = req.parent;

    if (!student || !student.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id: student_id, class_id, division_id, school_id } = student;

    // 1️⃣ Fetch New Materials
    const materials = await sequelize.query(
      `SELECT m.id, m.title, m.material_type, m.created_at,
              EXISTS(SELECT 1 FROM notification_reads nr WHERE nr.entity_id = m.id AND nr.entity_type = 'material' AND nr.student_id = :student_id) as dynamic_is_read
       FROM materials m 
       WHERE m.class_id = :class_id AND m.school_id = :school_id 
       ORDER BY m.created_at DESC LIMIT 5`,
      {
        replacements: { class_id, school_id, student_id },
        type: QueryTypes.SELECT,
      },
    );

    // 2️⃣ Fetch Exams (Exam Timetables)
    const exams = await sequelize.query(
      `SELECT t.id, t.title, t.exam_type, t.start_date, t.created_at,
              EXISTS(SELECT 1 FROM notification_reads nr WHERE nr.entity_id = t.id AND nr.entity_type = 'exam' AND nr.student_id = :student_id) as dynamic_is_read
       FROM timetables t
       WHERE t.class_id = :class_id AND t.school_id = :school_id AND t.is_active = true 
       ORDER BY t.created_at DESC LIMIT 5`,
      {
        replacements: { class_id, school_id, student_id },
        type: QueryTypes.SELECT,
      },
    );

    // 2.5️⃣ Fetch Class Timetables
    const schoolTimetables = await sequelize.query(
      `SELECT st.id, st.title, st.media_url, st.created_at,
              EXISTS(SELECT 1 FROM notification_reads nr WHERE nr.entity_id = st.id AND nr.entity_type = 'school_timetable' AND nr.student_id = :student_id) as dynamic_is_read
       FROM school_timetables st
       WHERE st.class_id = :class_id AND st.division_id = :division_id AND st.school_id = :school_id AND st.is_deleted = false
       ORDER BY st.created_at DESC LIMIT 5`,
      {
        replacements: {
          class_id,
          division_id: student.division_id,
          school_id,
          student_id,
        },
        type: QueryTypes.SELECT,
      },
    );

    // 3️⃣ Fetch Class-wide & School-wide Announcements
    const announcements = await sequelize.query(
      `SELECT n.*, t.name as teacher_name, t.subject as teacher_subject,
              EXISTS(SELECT 1 FROM notification_reads nr WHERE nr.entity_id = n.id AND nr.entity_type = 'announcement' AND nr.student_id = :student_id) as dynamic_is_read
       FROM notifications n 
       LEFT JOIN teachers t ON n.teacher_id = t.id 
       WHERE (n.class_id = :class_id OR n.class_id IS NULL) 
       AND n.school_id = :school_id 
       ORDER BY n.created_at DESC LIMIT 10`,
      {
        replacements: { class_id, school_id, student_id },
        type: QueryTypes.SELECT,
      },
    );

    // 4️⃣ Fetch Certificates
    const certificates = await sequelize.query(
      `SELECT c.id, c.certificate_title, c.date_awarded, c.created_at,
              EXISTS(SELECT 1 FROM notification_reads nr WHERE nr.entity_id = CAST(c.id AS INTEGER) AND nr.entity_type = 'certificate' AND nr.student_id = :student_id) as dynamic_is_read
       FROM teacher_certificates c 
       WHERE c.awarded_to = :student_id 
       ORDER BY c.created_at DESC LIMIT 5`,
      { replacements: { student_id }, type: QueryTypes.SELECT },
    );

    // 5️⃣ Fetch Awards
    const awards = await sequelize.query(
      `SELECT a.id, a.award_title, a.medal_type, a.date_awarded, a.created_at,
              EXISTS(SELECT 1 FROM notification_reads nr WHERE nr.entity_id = a.id AND nr.entity_type = 'award' AND nr.student_id = :student_id) as dynamic_is_read
       FROM teacher_awards a 
       WHERE a.awarded_to = :student_id 
       ORDER BY a.created_at DESC LIMIT 5`,
      { replacements: { student_id }, type: QueryTypes.SELECT },
    );

    // 6️⃣ Fetch Latest MCQs (Grouped by title and created_at)
    const mcqs = await sequelize.query(
      `SELECT MIN(q.id) as id, q.title, q.created_at,
              EXISTS(SELECT 1 FROM notification_reads nr WHERE nr.entity_id = MIN(q.id) AND nr.entity_type = 'mcq' AND nr.student_id = :student_id) as dynamic_is_read
       FROM mcq_questions q
       WHERE q.class_id = :class_id AND q.school_id = :school_id AND q.is_active = true
       GROUP BY q.title, q.created_at
       ORDER BY q.created_at DESC LIMIT 5`,
      {
        replacements: { class_id, school_id, student_id },
        type: QueryTypes.SELECT,
      },
    );

    // 6.5️⃣ Fetch Gallery Events
    const galleryEvents = await sequelize.query(
      `SELECT e.id, e.event_title, e.event_category, e.event_date, e.created_at,
              EXISTS(SELECT 1 FROM notification_reads nr WHERE nr.entity_id = e.id AND nr.entity_type = 'gallery' AND nr.student_id = :student_id) as dynamic_is_read
       FROM events e
       WHERE e.class_id = :class_id
         AND e.division_id = :division_id
         AND e.school_id = :school_id
         AND e.is_active = true
       ORDER BY e.created_at DESC LIMIT 5`,
      {
        replacements: { class_id, division_id, school_id, student_id },
        type: QueryTypes.SELECT,
      },
    );

    // 7️⃣ Fetch Attendance Alerts
    const attendanceAlerts = await sequelize.query(
      `SELECT a.id, a.date, a.status, a.created_at,
              EXISTS(SELECT 1 FROM notification_reads nr WHERE nr.entity_id = a.id AND nr.entity_type = 'attendance' AND nr.student_id = :student_id) as dynamic_is_read
       FROM attendance a 
       WHERE a.student_id = :student_id AND a.date >= CURRENT_DATE - INTERVAL '7 days' 
       ORDER BY a.created_at DESC`,
      { replacements: { student_id }, type: QueryTypes.SELECT },
    );

    const allNotifications = [
      ...materials.map((m) => ({
        ...m,
        is_read: !!m.dynamic_is_read,
        type: "Material",
        category: "Classroom",
      })),
      ...exams.map((e) => ({
        ...e,
        is_read: !!e.dynamic_is_read,
        type: "Exam",
        category: "School",
      })),
      ...schoolTimetables.map((st) => ({
        ...st,
        is_read: !!st.dynamic_is_read,
        media_url: buildMediaUrl(st.media_url, req),
        type: "Announcement",
        category: "Classroom",
        message: `New Class Timetable: ${st.title}`,
      })),
      ...announcements.map((a) => ({
        ...a,
        is_read: !!a.dynamic_is_read,
        media_url: buildMediaUrl(a.media_url, req, !a.teacher_id),
        type: "Announcement",
        category: a.class_id ? "Classroom" : "School",
      })),
      ...certificates.map((c) => ({
        ...c,
        is_read: !!c.dynamic_is_read,
        type: "Certificate",
        category: "Award",
      })),
      ...awards.map((a) => ({
        ...a,
        is_read: !!a.dynamic_is_read,
        type: "Award",
        category: "Award",
      })),
      ...mcqs.map((m) => ({
        ...m,
        is_read: !!m.dynamic_is_read,
        message: `New MCQ Practice available: ${m.title || "General Practice"}`,
        type: "MCQ",
        category: "Practice",
      })),
      ...galleryEvents.map((g) => ({
        ...g,
        id: g.id,
        title: g.event_title,
        is_read: !!g.dynamic_is_read,
        type: "Gallery",
        category: "School",
        message: `New photos added: ${g.event_title}`,
      })),
      ...attendanceAlerts.map((att) => ({
        ...att,
        is_read: !!att.dynamic_is_read,
        type: "Attendance",
        category: "Alert",
        message: `Student was marked ${att.status ? att.status.toUpperCase() : "PRESENT/ABSENT"} on ${new Date(att.date).toLocaleDateString("en-IN", { day: "numeric", month: "numeric", year: "numeric" })} at ${new Date(att.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" })}`,
      })),
    ];

    allNotifications.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );

    // --- Pagination Logic ---
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedNotifications = allNotifications.slice(startIndex, endIndex);
    // ------------------------

    const unreadBreakdown = {
      announcements: allNotifications.filter(
        (n) => n.type === "Announcement" && n.is_read === false,
      ).length,
      materials: allNotifications.filter(
        (n) => n.type === "Material" && n.is_read === false,
      ).length,
      exams: allNotifications.filter(
        (n) => n.type === "Exam" && n.is_read === false,
      ).length,
      certificates: allNotifications.filter(
        (n) => n.type === "Certificate" && n.is_read === false,
      ).length,
      awards: allNotifications.filter(
        (n) => n.type === "Award" && n.is_read === false,
      ).length,
      mcqs: allNotifications.filter(
        (n) => n.type === "MCQ" && n.is_read === false,
      ).length,
      attendance: allNotifications.filter(
        (n) => n.type === "Attendance" && n.is_read === false,
      ).length,
      gallery: allNotifications.filter(
        (n) => n.type === "Gallery" && n.is_read === false,
      ).length,
    };

    const totalUnread = Object.values(unreadBreakdown).reduce(
      (a, b) => a + b,
      0,
    );

    return res.json({
      success: true,
      total_count: allNotifications.length,
      returned_count: paginatedNotifications.length,
      total_unread: totalUnread,
      unread_breakdown: unreadBreakdown,
      pagination: {
        total_pages: Math.ceil(allNotifications.length / limit),
        current_page: page,
        limit: limit,
        has_more: endIndex < allNotifications.length,
      },
      notifications: paginatedNotifications,
    });
  } catch (error) {
    console.error("Get Student Notifications Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getSchoolNotifications = async (req, res) => {
  try {
    const student = req.parent; // In parentAuth, req.parent is the student_forms record

    if (!student || !student.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id: student_id, class_id, division_id, school_id } = student;

    // 1️⃣ Fetch New Materials Uploaded (Notes/Textbooks/etc)
    // const materials = await sequelize.query(
    //   `
    //         SELECT id, title, material_type, created_at
    //         FROM materials
    //         WHERE class_id = :class_id AND division_id = :division_id AND school_id = :school_id
    //         ORDER BY created_at DESC
    //         LIMIT 5
    //         `,
    //   {
    //     replacements: { class_id, division_id, school_id },
    //     type: QueryTypes.SELECT,
    //   }
    // );

    // 2️⃣ Fetch Exam/Test Announcements (Timetables)
    const exams = await sequelize.query(
      `
            SELECT id, title, exam_type, start_date, created_at
            FROM timetables
            WHERE class_id = :class_id AND school_id = :school_id AND is_active = true
            ORDER BY created_at DESC
            LIMIT 5
            `,
      {
        replacements: { class_id, school_id },
        type: QueryTypes.SELECT,
      },
    );

    // 3️⃣ Fetch Recent Messages from Teacher
    // const messages = await sequelize.query(
    //   `
    //         SELECT id, message, created_at
    //         FROM teacher_student_messages
    //         WHERE student_id = :student_id AND sender_role = 'teacher'
    //         ORDER BY created_at DESC
    //         LIMIT 5
    //         `,
    //   {
    //     replacements: { student_id },
    //     type: QueryTypes.SELECT,
    //   }
    // );

    // 4️⃣ Fetch Recent Certificates
    const certificates = await sequelize.query(
      `
            SELECT id, certificate_title, date_awarded, created_at
            FROM teacher_certificates
            WHERE awarded_to = :student_id
            ORDER BY created_at DESC
            LIMIT 5
            `,
      {
        replacements: { student_id },
        type: QueryTypes.SELECT,
      },
    );

    // 5️⃣ Fetch Recent Awards
    const awards = await sequelize.query(
      `
            SELECT id, award_title, medal_type, date_awarded, created_at
            FROM teacher_awards
            WHERE awarded_to = :student_id
            ORDER BY created_at DESC
            LIMIT 5
            `,
      {
        replacements: { student_id },
        type: QueryTypes.SELECT,
      },
    );

    // 6️⃣ Fetch Attendance Alerts (Specifically Absent records)
    // Fetches absences from the last 7 days
    // const attendanceAlerts = await sequelize.query(
    //   `
    //         SELECT date, status
    //         FROM attendance
    //         WHERE student_id = :student_id AND status = 'absent'
    //           AND date >= CURRENT_DATE - INTERVAL '7 days'
    //         ORDER BY date DESC
    //         `,
    //   {
    //     replacements: { student_id },
    //     type: QueryTypes.SELECT,
    //   }
    // );

    return res.json({
      success: true,
      notifications: {
        // materials: materials.map((m) => ({ ...m, type: "New Notes Uploaded" })),
        exams: exams.map((e) => ({ ...e, type: "Exam Test Announced" })),
        // messages: messages.map((msg) => ({
        //   ...msg,
        //   type: "Message from Teacher",
        // })),
        certificates_awards: [
          ...certificates.map((c) => ({ ...c, type: "New Certificate" })),
          ...awards.map((a) => ({ ...a, type: "New Award" })),
        ],
        // attendance: attendanceAlerts.map((att) => ({
        //   ...att,
        //   type: "Attendance Alert",
        //   message: `Student was marked ABSENT on ${new Date(
        //     att.date
        //   ).toLocaleDateString()}`,
        // })),
      },
    });
  } catch (error) {
    console.error("Get School Notifications Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getClassroomNotifications = async (req, res) => {
  try {
    const student = req.parent; // In parentAuth, req.parent is the student_forms record

    if (!student || !student.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id: student_id, class_id, division_id, school_id } = student;

    // 1️⃣ Fetch New Materials Uploaded (Notes/Textbooks/etc)
    const materials = await sequelize.query(
      `
            SELECT id, title, material_type, created_at
            FROM materials
            WHERE class_id = :class_id AND division_id = :division_id AND school_id = :school_id
            ORDER BY created_at DESC
            LIMIT 5
            `,
      {
        replacements: { class_id, division_id, school_id },
        type: QueryTypes.SELECT,
      },
    );

    // 2️⃣ Fetch Exam/Test Announcements (Timetables)
    // const exams = await sequelize.query(
    //   `
    //         SELECT id, title, exam_type, start_date, created_at
    //         FROM timetables
    //         WHERE class_id = :class_id AND school_id = :school_id AND is_active = true
    //         ORDER BY created_at DESC
    //         LIMIT 5
    //         `,
    //   {
    //     replacements: { class_id, school_id },
    //     type: QueryTypes.SELECT,
    //   }
    // );

    // 3️⃣ Fetch Recent Messages from Teacher
    const messages = await sequelize.query(
      `
            SELECT id, message, created_at
            FROM teacher_student_messages
            WHERE student_id = :student_id AND sender_role = 'teacher'
            ORDER BY created_at DESC
            LIMIT 5
            `,
      {
        replacements: { student_id },
        type: QueryTypes.SELECT,
      },
    );

    // 4️⃣ Fetch Recent Certificates
    // const certificates = await sequelize.query(
    //   `
    //         SELECT id, certificate_title, date_awarded, created_at
    //         FROM teacher_certificates
    //         WHERE awarded_to = :student_id
    //         ORDER BY created_at DESC
    //         LIMIT 5
    //         `,
    //   {
    //     replacements: { student_id },
    //     type: QueryTypes.SELECT,
    //   }
    // );

    // 5️⃣ Fetch Recent Awards
    // const awards = await sequelize.query(
    //   `
    //         SELECT id, award_title, medal_type, date_awarded, created_at
    //         FROM teacher_awards
    //         WHERE awarded_to = :student_id
    //         ORDER BY created_at DESC
    //         LIMIT 5
    //         `,
    //   {
    //     replacements: { student_id },
    //     type: QueryTypes.SELECT,
    //   }
    // );

    // 6️⃣ Fetch Attendance Alerts (Specifically Absent records)
    // Fetches absences from the last 7 days
    const attendanceAlerts = await sequelize.query(
      `
            SELECT date, status
            FROM attendance
            WHERE student_id = :student_id
              AND date >= CURRENT_DATE - INTERVAL '7 days'
            ORDER BY date DESC
            `,
      {
        replacements: { student_id },
        type: QueryTypes.SELECT,
      },
    );

    return res.json({
      success: true,
      notifications: {
        materials: materials.map((m) => ({ ...m, type: "New Notes Uploaded" })),
        // exams: exams.map((e) => ({ ...e, type: "Exam Test Announced" })),
        messages: messages.map((msg) => ({
          ...msg,
          type: "Message from Teacher",
        })),
        // certificates_awards: [
        //   ...certificates.map((c) => ({ ...c, type: "New Certificate" })),
        //   ...awards.map((a) => ({ ...a, type: "New Award" })),
        // ],
        attendance: attendanceAlerts.map((att) => ({
          ...att,
          type: "Attendance Alert",
          message: `Student was marked ${att.status ? att.status.toUpperCase() : "PRESENT/ABSENT"} on ${new Date(
            att.date,
          ).toLocaleDateString()}`,
        })),
      },
    });
  } catch (error) {
    console.error("Get Classroom Notifications Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET - Teacher Notifications for Student
 * Fetches notifications sent by teachers from the new notifications table
 */
exports.getTeacherNotifications = async (req, res) => {
  try {
    const student = req.parent;

    if (!student || !student.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { class_id, school_id } = student;

    const notifications = await sequelize.query(
      `
            SELECT n.*, t.name as teacher_name, t.subject as teacher_subject
            FROM notifications n
            JOIN teachers t ON n.teacher_id = t.id
            WHERE n.class_id = :class_id AND n.school_id = :school_id
            ORDER BY n.created_at DESC
            `,
      {
        replacements: { class_id, school_id },
        type: QueryTypes.SELECT,
      },
    );

    const notificationsWithUrl = notifications.map((n) => ({
      ...n,
      media_url: buildMediaUrl(n.media_url, req),
    }));

    return res.json({
      success: true,
      count: notifications.length,
      notifications: notificationsWithUrl,
    });
  } catch (error) {
    console.error("Get Teacher Notifications Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
/**
 * POST - Mark a notification/item as read
 * Body: { entity_id, entity_type }
 */
exports.markAsRead = async (req, res) => {
  try {
    const student = req.parent;
    const { entity_id, entity_type } = req.body;

    if (!student || !student.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!entity_id || !entity_type) {
      return res
        .status(400)
        .json({
          success: false,
          message: "entity_id and entity_type are required",
        });
    }

    await sequelize.query(
      `INSERT INTO notification_reads (student_id, entity_id, entity_type, read_at)
       VALUES (:student_id, :entity_id, :entity_type, NOW())
       ON CONFLICT (student_id, entity_id, entity_type) DO NOTHING`,
      {
        replacements: { student_id: student.id, entity_id, entity_type },
        type: QueryTypes.INSERT,
      },
    );

    return res.json({ success: true, message: "Marked as read" });
  } catch (error) {
    console.error("Mark As Read Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
/**
 * POST - Mark all notifications/items as read for the student
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const student = req.parent;

    if (!student || !student.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id: student_id, class_id, division_id, school_id } = student;

    // 1. Fetch all unread item IDs across all categories
    // This is a bit complex, but we can do it by inserting based on the same logic as getNotifications

    await sequelize.query(
      `
      -- Mark Announcements as Read
      INSERT INTO notification_reads (student_id, entity_id, entity_type, read_at)
      SELECT :student_id, id, 'announcement', NOW() FROM notifications 
      WHERE (class_id = :class_id OR class_id IS NULL) AND school_id = :school_id
      ON CONFLICT DO NOTHING;

      -- Mark Materials as Read
      INSERT INTO notification_reads (student_id, entity_id, entity_type, read_at)
      SELECT :student_id, id, 'material', NOW() FROM materials 
      WHERE class_id = :class_id AND school_id = :school_id
      ON CONFLICT DO NOTHING;

      -- Mark Exams as Read
      INSERT INTO notification_reads (student_id, entity_id, entity_type, read_at)
      SELECT :student_id, id, 'exam', NOW() FROM timetables 
      WHERE class_id = :class_id AND school_id = :school_id
      ON CONFLICT DO NOTHING;

      -- Mark School Timetables as Read
      INSERT INTO notification_reads (student_id, entity_id, entity_type, read_at)
      SELECT :student_id, id, 'school_timetable', NOW() FROM school_timetables 
      WHERE class_id = :class_id AND division_id = :division_id AND school_id = :school_id
      ON CONFLICT DO NOTHING;

      -- Mark Certificates as Read
      INSERT INTO notification_reads (student_id, entity_id, entity_type, read_at)
      SELECT :student_id, id, 'certificate', NOW() FROM teacher_certificates 
      WHERE awarded_to = :student_id
      ON CONFLICT DO NOTHING;

      -- Mark Awards as Read
      INSERT INTO notification_reads (student_id, entity_id, entity_type, read_at)
      SELECT :student_id, id, 'award', NOW() FROM teacher_awards 
      WHERE awarded_to = :student_id
      ON CONFLICT DO NOTHING;

      -- Mark Attendance as Read
      INSERT INTO notification_reads (student_id, entity_id, entity_type, read_at)
      SELECT :student_id, id, 'attendance', NOW() FROM attendance 
      WHERE student_id = :student_id
      ON CONFLICT DO NOTHING;

      -- Mark MCQs as Read
      INSERT INTO notification_reads (student_id, entity_id, entity_type, read_at)
      SELECT :student_id, MIN(id), 'mcq', NOW() FROM mcq_questions 
      WHERE class_id = :class_id AND school_id = :school_id
      GROUP BY title, created_at
      ON CONFLICT DO NOTHING;

      -- Mark Gallery Events as Read
      INSERT INTO notification_reads (student_id, entity_id, entity_type, read_at)
      SELECT :student_id, id, 'gallery', NOW() FROM events
      WHERE class_id = :class_id AND division_id = :division_id AND school_id = :school_id AND is_active = true
      ON CONFLICT DO NOTHING;
    `,
      {
        replacements: { student_id, class_id, division_id, school_id },
        type: QueryTypes.INSERT,
      },
    );

    return res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark All As Read Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
