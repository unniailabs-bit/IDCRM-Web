const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");
const { Parser } = require("json2csv");
// ======================
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
        `SELECT DISTINCT ON (sf.id)
          sf.id AS "Form ID",
          sf.roll_number AS "Roll No",
          sf.gr_number AS "GR No",
          sf.first_name || ' ' || sf.last_name AS "Student Name",
          sf.dob AS "DOB",
          sf.gender AS "Gender",
          sf.blood_group AS "Blood",
          sf.street_address || ', ' || sf.city || ', ' || sf.state || ', ' || sf.pin_code AS "Address",
          sf.father_name AS "Father Name",
          COALESCE(sf.father_phone, sf.parent_phone, '') AS "Father Phone",
          sf.mother_name AS "Mother Name",
          COALESCE(sf.mother_phone, '') AS "Mother Phone",
          sf.emergency_contact AS "Emergency",
          CASE 
            WHEN sf.student_signature IS NOT NULL AND sf.student_signature != '' THEN 
              (CASE WHEN sf.student_signature LIKE 'http%' THEN sf.student_signature ELSE :backendUrl || sf.student_signature END)
            ELSE '' 
          END AS "Singnature",
          sf.status AS "Status",
          d.class_name AS "Class",
          d.division_name AS "Division",
          sg.generated_id AS "Generated ID",
          CASE WHEN sg.generated_id IS NOT NULL THEN 'Printed' ELSE 'Not Printed' END AS "ID Status"
        FROM student_forms sf
        LEFT JOIN divisions d ON sf.division_id = d.id
        LEFT JOIN student_generated_ids sg ON sf.id = sg.student_form_id
        WHERE ${schoolFilter}
          AND LOWER(sf.status) = 'approved'
        ORDER BY sf.id, d.class_name, d.division_name, sf.roll_number`,
        { replacements: { schoolId, schoolCustomId, backendUrl: process.env.BACKEND_URL || "http://localhost:5000" }, type: QueryTypes.SELECT }
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

    // 2️⃣ Get Divisions (Hybrid support)
    console.log("🔍 Getting divisions for school:", schoolId || schoolCustomId);

    const legacySchoolFilter = schoolId
      ? `school_id = :schoolId`
      : `school_id = (SELECT id FROM schools WHERE custom_id = :schoolCustomId)`;

    const divisionsQuery = `
      SELECT DISTINCT d.id, d.class_name, d.division_name, d.class_teacher
      FROM divisions d
      LEFT JOIN classes c ON d.class_id = c.id
      WHERE (
        (d.class_id IS NOT NULL AND ${schoolJoinFilter})
        OR
        (d.class_id IS NULL AND d.class_name IN (
          SELECT class_name FROM classes WHERE ${legacySchoolFilter}
        ))
      )
      ORDER BY d.class_name, d.division_name
    `;

    const divisions = await sequelize.query(
      divisionsQuery,
      { replacements: { schoolId, schoolCustomId }, type: QueryTypes.SELECT }
    );

    if (!divisions.length) return res.json({ success: true, data: [] });

    const divisionIds = divisions.map(d => d.id);

    // 3️⃣ Get Counts
    const forms = await sequelize.query(
      `SELECT sf.division_id,
              COUNT(DISTINCT sf.id) AS total_forms,
              COUNT(DISTINCT sf.id) FILTER (WHERE LOWER(sf.status) = 'approved') AS approved,
              COUNT(DISTINCT sf.id) FILTER (WHERE LOWER(sf.status) = 'rejected') AS rejected,
              COUNT(DISTINCT sf.id) FILTER (WHERE LOWER(sf.status) IN ('pending', 'submitted')) AS pending,
              COUNT(DISTINCT sf.id) FILTER (WHERE sg.generated_id IS NOT NULL) AS id_generated,
              COUNT(DISTINCT sf.id) FILTER (WHERE LOWER(sf.status) = 'approved' AND sg.generated_id IS NULL) AS id_pending
       FROM student_forms sf
       LEFT JOIN student_generated_ids sg ON sf.id = sg.student_form_id
       WHERE sf.division_id IN (:divisionIds)
         AND ${schoolFilter}
       GROUP BY sf.division_id`,
      { replacements: { divisionIds, schoolId, schoolCustomId }, type: QueryTypes.SELECT }
    );

    // 4️⃣ Build Summary
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

    // Build school filter for classes table (with 'c' alias for JOIN)
    const classJoinFilter = schoolId
      ? `c.school_id = :schoolId`
      : `c.school_id = (SELECT id FROM schools WHERE custom_id = :schoolCustomId)`;

    // Build school filter for classes subquery (no alias)
    const classSubqueryFilter = schoolId
      ? `school_id = :schoolId`
      : `school_id = (SELECT id FROM schools WHERE custom_id = :schoolCustomId)`;

    // Hybrid approach: Find division by class_name and division_name
    // Works for both divisions with class_id and without class_id
    const divisionResult = await sequelize.query(
      `SELECT DISTINCT d.id
       FROM divisions d
       LEFT JOIN classes c ON d.class_id = c.id
       WHERE LOWER(d.class_name) = LOWER(:className)
         AND LOWER(d.division_name) = LOWER(:division)
         AND (
           -- New structure: divisions with valid class_id
           (d.class_id IS NOT NULL AND ${classJoinFilter})
           OR
           -- Legacy structure: divisions without class_id but matching class_name
           (d.class_id IS NULL AND d.class_name IN (
             SELECT class_name FROM classes WHERE ${classSubqueryFilter}
           ))
         )`,
      { replacements: { className, division, schoolId, schoolCustomId }, type: QueryTypes.SELECT }
    );

    if (!divisionResult.length) {
      return res.status(404).json({ success: false, message: 'Class/Division not found' });
    }

    const classIds = divisionResult.map(d => d.id);
    console.log(`🔍 Found division IDs for ${className}-${division}:`, classIds);

    // Fetch Students (division_id fixed)
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";

    // Debug: Log the actual query parameters
    console.log('📊 Query params:', { schoolId, schoolCustomId, classIds, schoolFilter });

    const students = await sequelize.query(
      `SELECT DISTINCT ON (sf.id)
      sf.id,
      sf.roll_number,
      sf.gr_number,
      sf.first_name,
      sf.last_name,
      sf.first_name || ' ' || sf.last_name AS student_name,
      sf.dob,
      sf.gender,
      sf.blood_group,
      CASE
        WHEN sf.photo IS NOT NULL AND sf.photo != '' THEN
          (CASE WHEN sf.photo LIKE 'http%' THEN sf.photo ELSE :backendUrl || sf.photo END)
        ELSE NULL
      END AS photo,
      CASE
        WHEN sf.student_signature IS NOT NULL AND sf.student_signature != '' THEN
          (CASE WHEN sf.student_signature LIKE 'http%' THEN sf.student_signature ELSE :backendUrl || sf.student_signature END)
        ELSE NULL
      END AS student_signature,
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
      CASE WHEN EXISTS (
        SELECT 1 FROM student_generated_ids sg WHERE sg.student_form_id = sf.id
      ) THEN TRUE ELSE FALSE END AS has_generated_id,
      CASE WHEN EXISTS (
        SELECT 1 FROM student_generated_ids sg WHERE sg.student_form_id = sf.id
      ) THEN 'Printed' ELSE 'Not Printed' END AS id_status
   FROM student_forms sf
   WHERE ${schoolFilter}
     AND sf.division_id IN (:classIds)
     AND LOWER(sf.status) = 'approved'
   ORDER BY sf.id, sf.roll_number`,
      {
        replacements: { schoolId, schoolCustomId, classIds, backendUrl },
        type: QueryTypes.SELECT
      }
    );

    // Debug: Log actual student IDs returned
    console.log('📋 Student IDs returned:', students.map(s => `${s.id}`).join(', '));

    console.log(`✅ Found ${students.length} students for ${className}-${division}`);

    return res.json({
      success: true,
      data: students,
      meta: {
        className,
        division,
        totalStudents: students.length,
        approved: students.filter(s => s.status?.toLowerCase() === 'approved').length,
        pending: students.filter(s => ['pending', 'submitted'].includes(s.status?.toLowerCase())).length,
        rejected: students.filter(s => s.status?.toLowerCase() === 'rejected').length,
        id_generated: students.filter(s => s.has_generated_id).length,
        id_pending: students.filter(s => s.status?.toLowerCase() === 'approved' && !s.has_generated_id).length
      }
    });

  } catch (err) {
    console.error("🔥 Error in getClassStudentForms:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getSchoolFormsSummary, getClassStudentForms };