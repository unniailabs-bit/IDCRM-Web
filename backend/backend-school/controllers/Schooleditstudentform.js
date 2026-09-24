const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");

// =======================
// GET ALL APPROVED STUDENT FORMS (SCHOOL)
// =======================
const getStudentFormsSchool = async (req, res) => {
  try {
    const schoolId = req.user?.school_id;
    if (!schoolId)
      return res.status(400).json({ success: false, message: "School ID missing" });

    // Get divisions for this school
    const divisions = await sequelize.query(
      `SELECT d.id, c.class_name, d.division_name
       FROM divisions d
       JOIN classes c ON d.class_id = c.id
       WHERE c.school_id = :schoolId`,
      { replacements: { schoolId }, type: QueryTypes.SELECT }
    );

    if (!divisions.length) return res.json({ success: true, data: [] });

    const divisionIds = divisions.map(d => d.id);

    // Get only APPROVED student forms linked to these divisions
    const forms = await sequelize.query(
      `SELECT
         sf.*,
         sf.street_address || ', ' || sf.city || ', ' || sf.state || ', ' || sf.pin_code AS address,
         COALESCE(c.class_name,'') as class_name,
         COALESCE(d.division_name,'') as division_name
       FROM student_forms sf
       LEFT JOIN divisions d ON sf.division_id = d.id
       LEFT JOIN classes c ON d.class_id = c.id
       WHERE sf.division_id IN (:divisionIds) AND sf.status = 'approved'
       ORDER BY sf.created_at DESC`,
      { replacements: { divisionIds }, type: QueryTypes.SELECT }
    );

    const formsWithLinks = forms.map(f => ({
      ...f,
      link: `/school/student-form/${f.id}`,
    }));

    return res.json({ success: true, data: formsWithLinks });
  } catch (err) {
    console.error("🔥 Error in getStudentFormsSchool:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// =======================
// APPROVE / REJECT FORM (SCHOOL)
// =======================
const updateFormStatusSchool = async (req, res) => {
  try {
    const schoolId = req.user?.school_id;
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status))
      return res.status(400).json({ success: false, message: "Invalid status" });

    // Verify form belongs to this school
    const form = await sequelize.query(
      `SELECT sf.id
       FROM student_forms sf
       LEFT JOIN divisions d ON sf.division_id = d.id
       LEFT JOIN classes c ON d.class_id = c.id
       WHERE sf.id = :id AND c.school_id = :schoolId`,
      { replacements: { id, schoolId }, type: QueryTypes.SELECT }
    );

    if (!form.length)
      return res.status(403).json({ success: false, message: "Not authorized" });

    // Update status
    await sequelize.query(
      `UPDATE student_forms 
       SET status = :status, updated_at = NOW()
       WHERE id = :id`,
      { replacements: { status, id }, type: QueryTypes.UPDATE }
    );

    return res.json({ success: true, message: `Form ${status} successfully` });
  } catch (err) {
    console.error("🔥 Error in updateFormStatusSchool:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// =======================
// REQUEST CORRECTION (SCHOOL)
// =======================
const requestCorrectionSchool = async (req, res) => {
  try {
    const schoolId = req.user?.school_id;
    const { id } = req.params;
    const { correction_notes } = req.body;

    if (!correction_notes || correction_notes.trim() === "")
      return res.status(400).json({ success: false, message: "Correction notes are required" });

    // Verify form belongs to this school
    const form = await sequelize.query(
      `SELECT sf.id
       FROM student_forms sf
       LEFT JOIN divisions d ON sf.division_id = d.id
       LEFT JOIN classes c ON d.class_id = c.id
       WHERE sf.id = :id AND c.school_id = :schoolId`,
      { replacements: { id, schoolId }, type: QueryTypes.SELECT }
    );

    if (!form.length) return res.status(404).json({ success: false, message: "Form not found" });

    // Update correction notes and set status back to 'submitted'
    await sequelize.query(
      `UPDATE student_forms
       SET correction_notes = :correction_notes,
           status = 'submitted',
           updated_at = NOW()
       WHERE id = :id`,
      { replacements: { correction_notes, id }, type: QueryTypes.UPDATE }
    );

    return res.json({ success: true, message: "Correction request sent successfully" });
  } catch (err) {
    console.error("🔥 Error in requestCorrectionSchool:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// =======================
// UPDATE STUDENT FORM DETAILS DIRECTLY (SCHOOL)
// =======================
const updateStudentFormSchool = async (req, res) => {
  try {
    const schoolId = req.user?.school_id;
    const { id } = req.params;
    const updateData = req.body;

    // Verify form belongs to this school
    const form = await sequelize.query(
      `SELECT sf.id
       FROM student_forms sf
       LEFT JOIN divisions d ON sf.division_id = d.id
       LEFT JOIN classes c ON d.class_id = c.id
       WHERE sf.id = :id AND c.school_id = :schoolId`,
      { replacements: { id, schoolId }, type: QueryTypes.SELECT }
    );

    if (!form.length) return res.status(404).json({ success: false, message: "Form not found" });

    const allowedFields = [
      'first_name', 'middle_name', 'last_name', 'dob', 'gender', 'blood_group', 'photo',
      'father_name', 'mother_name', 'street_address', 'city', 'state', 'pin_code', 'emergency_contact',
      'parent_name', 'parent_phone', 'parent_email', 'roll_number', 'status', 'father_phone', 'mother_phone',
      'division_id', 'gr_number', 'sr_number', 'admission_number', 'bus_number', 'father_occupation',
      'mother_occupation', 'guardian_name', 'guardian_contact', 'guardian_relation', 'mother_email', 'father_email',
      'correction_notes', 'student_signature'
    ];

    const finalUpdateData = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        let value = updateData[key];

        // Normalize DOB if present
        if (key === 'dob' && value) {
          try {
            const dateObj = new Date(value);
            if (!isNaN(dateObj.getTime())) {
              value = dateObj.toISOString().split('T')[0];
            }
          } catch (e) {
            console.warn("Date parsing failed for:", value);
          }
        }

        finalUpdateData[key] = value;
      }
    });

    // Handle File Uploads (Photo, Father Photo, etc.)
    if (req.files) {
      const fileFields = ['photo', 'father_photo', 'mother_photo', 'guardian_photo', 'student_signature'];
      fileFields.forEach(field => {
        if (req.files[field] && req.files[field][0]) {
          // Store relative path: /uploads/filename.ext
          finalUpdateData[field] = `/uploads/${req.files[field][0].filename}`;
        }
      });
    }

    if (!Object.keys(finalUpdateData).length)
      return res.status(400).json({ success: false, message: "No valid fields to update" });

    const setClause = Object.keys(finalUpdateData).map(f => `"${f}" = :${f}`).join(", ");

    await sequelize.query(
      `UPDATE student_forms SET ${setClause}, updated_at = NOW() WHERE id = :id`,
      { replacements: { ...finalUpdateData, id }, type: QueryTypes.UPDATE }
    );

    const [updatedForm] = await sequelize.query(
      `SELECT sf.*, c.class_name, d.division_name
       FROM student_forms sf
       LEFT JOIN divisions d ON sf.division_id = d.id
       LEFT JOIN classes c ON d.class_id = c.id
       WHERE sf.id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    return res.json({ success: true, message: "Student details updated successfully", data: updatedForm });
  } catch (err) {
    console.error("🔥 Error in updateStudentFormSchool:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getStudentFormsSchool,
  updateFormStatusSchool,
  requestCorrectionSchool,
  updateStudentFormSchool
};
