const { QueryTypes } = require('sequelize');
const sequelize = require('../../config/db');

// ---------------- Get Student Enrollment Report ----------------
exports.getStudentEnrollmentReport = async (req, res) => {
  try {
    const schoolId = req.user?.school_id;
    const { startDate, endDate, classFilter } = req.query;

    if (!schoolId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: School ID missing' });
    }

    let query = `
      SELECT 
        DATE(s."createdAt") as date,
        COUNT(*) as count
      FROM students s
      INNER JOIN classes c ON s.class_id = c.id
      WHERE s.school_id = :school_id
    `;
    const replacements = { school_id: schoolId };

    if (startDate) {
      query += ` AND s."createdAt" >= :start_date`;
      replacements.start_date = startDate;
    }
    if (endDate) {
      query += ` AND s."createdAt" <= :end_date`;
      replacements.end_date = endDate;
    }
    if (classFilter && classFilter !== 'all') {
      query += ` AND c.class_name = :class_filter`;
      replacements.class_filter = classFilter;
    }

    query += ` GROUP BY DATE(s."createdAt") ORDER BY date ASC`;

    const data = await sequelize.query(query, { replacements, type: QueryTypes.SELECT });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Get Student Enrollment Report Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching enrollment report' });
  }
};

// ---------------- Get Form Submission Analytics ----------------
exports.getFormSubmissionAnalytics = async (req, res) => {
  try {
    const schoolId = req.user?.school_id;
    const { startDate, endDate } = req.query;

    if (!schoolId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: School ID missing' });
    }

    let query = `
      SELECT 
        DATE(sf.created_at) as date,
        COUNT(*) FILTER (WHERE LOWER(sf.status) = 'approved') as approved,
        COUNT(*) FILTER (WHERE LOWER(sf.status) = 'pending') as pending,
        COUNT(*) FILTER (WHERE LOWER(sf.status) = 'rejected') as rejected,
        COUNT(*) as total
      FROM student_forms sf
      WHERE sf.school_id = :school_id
    `;
    const replacements = { school_id: schoolId };

    if (startDate) {
      query += ` AND sf.created_at >= :start_date`;
      replacements.start_date = startDate;
    }
    if (endDate) {
      query += ` AND sf.created_at <= :end_date`;
      replacements.end_date = endDate;
    }

    query += ` GROUP BY DATE(sf.created_at) ORDER BY date ASC`;

    const data = await sequelize.query(query, { replacements, type: QueryTypes.SELECT });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Get Form Submission Analytics Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching form analytics' });
  }
};

// ---------------- Get ID Card Generation Report ----------------
exports.getIdCardGenerationReport = async (req, res) => {
  try {
    const schoolId = req.user?.school_id;
    const { startDate, endDate } = req.query;

    if (!schoolId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: School ID missing' });
    }

    let query = `
      SELECT 
        DATE(sgi.created_at) as date,
        COUNT(*) as count,
        COALESCE(SUM(sgi.credits_deducted), 0) as credits_used
      FROM student_generated_ids sgi
      WHERE sgi.school_id = :school_id
    `;
    const replacements = { school_id: schoolId };

    if (startDate) {
      query += ` AND sgi.created_at >= :start_date`;
      replacements.start_date = startDate;
    }
    if (endDate) {
      query += ` AND sgi.created_at <= :end_date`;
      replacements.end_date = endDate;
    }

    query += ` GROUP BY DATE(sgi.created_at) ORDER BY date ASC`;

    const data = await sequelize.query(query, { replacements, type: QueryTypes.SELECT });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Get ID Card Generation Report Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching ID card report' });
  }
};

// ---------------- Get Teacher Performance Report ----------------
exports.getTeacherPerformanceReport = async (req, res) => {
  try {
    const schoolId = req.user?.school_id;

    if (!schoolId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: School ID missing' });
    }

    const data = await sequelize.query(
      `SELECT 
        t.id,
        t.name,
        t.subject,
        COUNT(DISTINCT d.id) as divisions_assigned,
        COUNT(DISTINCT s.id) as students_managed,
        COUNT(DISTINCT sf.id) as forms_reviewed,
        COUNT(DISTINCT CASE WHEN LOWER(sf.status) = 'approved' THEN sf.id END) as forms_approved
      FROM teachers t
      LEFT JOIN divisions d ON d.class_teacher = t.name
      LEFT JOIN classes c ON d.class_id = c.id AND c.school_id = :school_id
      LEFT JOIN students s ON s.division_id = d.id AND s.school_id = :school_id
      LEFT JOIN student_forms sf ON sf.teacher_id = t.id AND sf.school_id = :school_id
      WHERE t.school_id = :school_id
      GROUP BY t.id, t.name, t.subject
      ORDER BY forms_reviewed DESC`,
      { replacements: { school_id: schoolId }, type: QueryTypes.SELECT }
    );

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Get Teacher Performance Report Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching teacher performance' });
  }
};

