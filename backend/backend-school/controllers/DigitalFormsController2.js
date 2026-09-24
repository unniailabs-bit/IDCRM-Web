const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");
const { Parser } = require("json2csv");

// =================
// Get School Forms Summary
// ======================
const getSchoolFormsSummary = async (req, res) => {
  try {
    let schoolId = req.user?.school_id ? parseInt(req.user.school_id, 10) : null;
    let schoolCustomId = req.user?.school_custom_id || null;

    if (!schoolId && !schoolCustomId) {
      return res.status(400).json({ success: false, message: "School ID or custom ID missing" });
    }

    // School filters using alias 'sf'
    const schoolFilter = schoolId 
      ? `sf.school_id = :schoolId` 
      : `sf.school_id = (SELECT id FROM schools WHERE custom_id = :schoolCustomId)`;

    const schoolJoinFilter = schoolId 
      ? `c.school_id = :schoolId` 
      : `c.school_id = (SELECT id FROM schools WHERE custom_id = :schoolCustomId)`;

    // 1️⃣ CSV Export
    if (req.query.export?.toLowerCase() === "csv") {
      const approvedForms = await sequelize.query(
        `SELECT 
          sf.roll_number AS "Roll No",
          sf.first_name || ' ' || sf.last_name AS "Student Name",
          sf.dob AS "DOB",
          sf.blood_group AS "Blood",
          sf.street_address || ', ' || sf.city || ', ' || sf.state || ', ' || sf.pin_code AS "Address",
          sf.father_name AS "Father Name",
          COALESCE(sf.father_phone, sf.parent_phone, '') AS "Father Phone",
          sf.mother_name AS "Mother Name",
          COALESCE(sf.mother_phone, '') AS "Mother Phone",
          sf.emergency_contact AS "Emergency",
          sf.status AS "Status"
        FROM student_forms sf
        WHERE ${schoolFilter}
          AND LOWER(sf.status) = 'approved'
        ORDER BY sf.division_id, sf.roll_number`,
        { replacements: { schoolId, schoolCustomId }, type: QueryTypes.SELECT }
      );

      if (!approvedForms.length) {
        return res.json({ success: true, message: "No approved forms found", data: [] });
      }

      const parser = new Parser();
      const csv = parser.parse(approvedForms);
      res.header("Content-Type", "text/csv");
      res.attachment("approved_student_forms.csv");
      return res.send(csv);
    }

    // 2️⃣ Get Divisions
    const divisions = await sequelize.query(
      `SELECT d.id, d.class_name, d.division_name, d.class_teacher
       FROM divisions d
       INNER JOIN classes c ON d.class_name = c.class_name
       WHERE ${schoolJoinFilter}
       ORDER BY d.class_name, d.division_name`,
      { replacements: { schoolId, schoolCustomId }, type: QueryTypes.SELECT }
    );

    if (!divisions.length) return res.json({ success: true, data: [] });

    const divisionIds = divisions.map(d => d.id);

    // 3️⃣ Get Counts (Alias 'sf' added to FROM student_forms)
    const forms = await sequelize.query(
      `SELECT sf.division_id,
              COUNT(*) AS total_forms,
              COUNT(*) FILTER (WHERE LOWER(sf.status) = 'approved') AS approved,
              COUNT(*) FILTER (WHERE LOWER(sf.status) = 'rejected') AS rejected,
              COUNT(*) FILTER (WHERE LOWER(sf.status) IN ('pending', 'submitted')) AS pending
       FROM student_forms sf
       WHERE sf.division_id IN (:divisionIds) AND ${schoolFilter}
       GROUP BY sf.division_id`,
      { replacements: { divisionIds, schoolId, schoolCustomId }, type: QueryTypes.SELECT }
    );

    // 4️⃣ Build summary
    const summary = divisions.map(div => {
      const formData = forms.find(f => f.division_id === div.id) || {};
      return {
        division_id: div.id,
        class_name: div.class_name,
        division: div.division_name || "N/A",
        class_teacher: div.class_teacher || "N/A",
        total_forms: parseInt(formData.total_forms || 0, 10),
        approved: parseInt(formData.approved || 0, 10),
        rejected: parseInt(formData.rejected || 0, 10),
        pending: parseInt(formData.pending || 0, 10),
      };
    });

    return res.json({ success: true, data: summary });

  } catch (err) {
    console.error("🔥 Error in getSchoolFormsSummary:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================
// Get Class Student Forms
// ======================
const getClassStudentForms = async (req, res) => {
  try {
    let schoolId = req.user?.school_id ? parseInt(req.user.school_id, 10) : null;
    let schoolCustomId = req.user?.school_custom_id || null;

    if (!schoolId && !schoolCustomId) {
      return res.status(400).json({ success: false, message: "School ID or custom ID missing" });
    }

    const { className, division } = req.query;
    if (!className || !division) {
      return res.status(400).json({ success: false, message: "Class name and division are required" });
    }

    const schoolFilter = schoolId 
      ? `sf.school_id = :schoolId` 
      : `sf.school_id = (SELECT id FROM schools WHERE custom_id = :schoolCustomId)`;

    const divisionResult = await sequelize.query(
      `SELECT id FROM divisions
       WHERE LOWER(class_name) = LOWER(:className)
         AND LOWER(division_name) = LOWER(:division)`,
      { replacements: { className, division }, type: QueryTypes.SELECT }
    );

    if (!divisionResult.length) {
      return res.status(404).json({ success: false, message: 'Class/Division not found' });
    }

    const classIds = divisionResult.map(d => d.id);

    // Fetch Students (division_id fixed)
    const students = await sequelize.query(
      `SELECT
        sf.id,
        sf.roll_number,
        sf.first_name,
        sf.last_name,
        sf.first_name || ' ' || sf.last_name AS student_name,
        sf.dob,
        sf.gender,
        sf.blood_group,
        CASE 
          WHEN sf.photo IS NOT NULL AND sf.photo != '' THEN 
            (CASE WHEN sf.photo LIKE 'http%' THEN sf.photo ELSE 'http://localhost:5000' || sf.photo END)
          ELSE NULL 
        END AS photo,
        sf.father_name,
        sf.mother_name,
        sf.street_address,
        sf.city,
        sf.state,
        sf.pin_code,
        sf.street_address || ', ' || sf.city || ', ' || sf.state || ', ' || sf.pin_code AS address,
        sf.emergency_contact,
        sf.parent_name,
        sf.parent_phone,
        COALESCE(sf.father_phone, sf.parent_phone, '') AS father_phone,
        COALESCE(sf.mother_phone, '') AS mother_phone,
        sf.parent_email,
        sf.status,
        sf.created_at,
        CASE WHEN sg.id IS NOT NULL THEN TRUE ELSE FALSE END AS has_generated_id,
        CASE WHEN sg.id IS NOT NULL THEN 'Printed' ELSE 'Not Printed' END AS id_status
      FROM student_forms sf
      LEFT JOIN student_generated_ids sg ON sf.id = sg.student_form_id
      WHERE ${schoolFilter}
        AND sf.division_id IN (:classIds)
        AND LOWER(sf.status) = 'approved'
      ORDER BY sf.roll_number`,
      { replacements: { schoolId, schoolCustomId, classIds }, type: QueryTypes.SELECT }
    );

    return res.json({
      success: true,
      data: students,
      meta: {
        className,
        division,
        totalStudents: students.length,
        approved: students.filter(s => s.status?.toLowerCase() === 'approved').length,
        pending: students.filter(s => ['pending', 'submitted'].includes(s.status?.toLowerCase())).length,
        rejected: students.filter(s => s.status?.toLowerCase() === 'rejected').length
      }
    });

  } catch (err) {
    console.error("🔥 Error in getClassStudentForms:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getSchoolFormsSummary, getClassStudentForms };