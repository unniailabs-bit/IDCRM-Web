const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");

// =======================
// GET ALL STUDENT FORMS
// =======================
const getStudentForms = async (req, res) => {
  try {
    const teacherId = req.teacher?.id;
    if (!teacherId)
      return res.status(400).json({ success: false, message: "Teacher ID missing" });

    // 2) Teacher ke saare divisions using teacher_id
    const divisions = await sequelize.query(
      `SELECT id, class_name, division_name 
       FROM divisions 
       WHERE teacher_id = :teacherId`,
      { replacements: { teacherId }, type: QueryTypes.SELECT }
    );

    if (!divisions.length) return res.json({ success: true, data: [] });

    const divisionIds = divisions.map((d) => d.id);

    // 3) Student forms linked with division_id
    const forms = await sequelize.query(
      `SELECT
        sf.*,
        sf.street_address || ', ' || sf.city || ', ' || sf.state || ', ' || sf.pin_code AS address,
        d.class_name,
        d.division_name
       FROM student_forms sf
       INNER JOIN divisions d ON sf.division_id = d.id
       WHERE sf.division_id IN (:divisionIds)
       ORDER BY sf.created_at DESC`,
      { replacements: { divisionIds }, type: QueryTypes.SELECT }
    );

    // 4) Add link for each form
    const formsWithLinks = forms.map((f) => ({
      ...f,
      link: `/teacher/student-form/${f.id}`,
    }));

    return res.json({ success: true, data: formsWithLinks });
  } catch (err) {
    console.error("🔥 Error in getStudentForms:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// =======================
// APPROVE / REJECT FORM
// =======================
const updateFormStatus = async (req, res) => {
  try {
    const teacherId = req.teacher?.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status))
      return res.status(400).json({ success: false, message: "Invalid status" });

    // 2) Verify form belongs to teacher's division using teacher_id
    const form = await sequelize.query(
      `SELECT sf.*, d.teacher_id
       FROM student_forms sf
       JOIN divisions d ON sf.division_id = d.id
       WHERE sf.id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!form.length)
      return res.status(404).json({ success: false, message: "Form not found" });

    if (form[0].teacher_id !== teacherId)
      return res.status(403).json({ success: false, message: "Not authorized" });

    // 3) Update status
    await sequelize.query(
      `UPDATE student_forms 
       SET status = :status, updated_at = NOW() 
       WHERE id = :id`,
      { replacements: { status, id }, type: QueryTypes.UPDATE }
    );

    return res.json({
      success: true,
      message: `Form ${status} successfully`,
    });
  } catch (err) {
    console.error("🔥 Error in updateFormStatus:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// =======================
// REQUEST CORRECTION WITH FIELD-LEVEL MARKING
// =======================
const requestCorrection = async (req, res) => {
  try {
    const teacherId = req.teacher?.id;
    const { id } = req.params;
    const {
      fields_requiring_correction,
      correction_field_notes,
      correction_notes
    } = req.body;

    if (!fields_requiring_correction || Object.keys(fields_requiring_correction).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one field for correction'
      });
    }

    // Verify form belongs to teacher using teacher_id
    const form = await sequelize.query(
      `SELECT sf.*, d.teacher_id, fl.token as form_link_token
       FROM student_forms sf
       JOIN divisions d ON sf.division_id = d.id
       LEFT JOIN form_links fl ON sf.form_link_token = fl.token
       WHERE sf.id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!form.length) {
      return res.status(404).json({ success: false, message: 'Form not found' });
    }

    if (form[0].teacher_id !== teacherId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Generate individual form token
    const crypto = require('crypto');
    const individualToken = crypto.randomBytes(16).toString('hex');
    const baseToken = form[0].form_link_token || individualToken;
    const revision = (form[0].revision_number || 0) + 1;

    // Update form with correction data
    const updateResult = await sequelize.query(
      `UPDATE student_forms 
       SET 
         requires_correction = true,
         fields_requiring_correction = :fields_requiring_correction::jsonb,
         correction_field_notes = :correction_field_notes::jsonb,
         correction_notes = :correction_notes,
         individual_form_token = :individual_token,
         form_link_token = COALESCE(:form_link_token, form_link_token),
         revision_number = :revision,
         status = 'submitted',
         correction_sent_at = NOW(),
         updated_at = NOW()
       WHERE id = :id
       RETURNING *`,
      {
        replacements: {
          id,
          fields_requiring_correction: JSON.stringify(fields_requiring_correction),
          correction_field_notes: JSON.stringify(correction_field_notes || {}),
          correction_notes: correction_notes || null,
          individual_token: individualToken,
          form_link_token: baseToken,
          revision
        },
        type: QueryTypes.UPDATE
      }
    );

    // Generate correction link
    const correctionLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/public-form/${baseToken}?formId=${id}&revision=${revision}&token=${individualToken}`;

    // TODO: Send link via email/SMS/WhatsApp to parent
    // For now, return the link

    return res.json({
      success: true,
      message: 'Correction request sent successfully',
      data: {
        correction_link: correctionLink,
        individual_token: individualToken
      }
    });
  } catch (err) {
    console.error('🔥 Error in requestCorrection:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =======================
// UPDATE STUDENT FORM DETAILS DIRECTLY
// =======================
const updateStudentForm = async (req, res) => {
  try {
    const teacherId = req.teacher?.id;
    const { id } = req.params;
    const updateData = req.body;

    // 2) Verify form belongs to teacher's division using teacher_id
    const form = await sequelize.query(
      `SELECT sf.*, d.teacher_id
       FROM student_forms sf
       JOIN divisions d ON sf.division_id = d.id
       WHERE sf.id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!form.length)
      return res.status(404).json({ success: false, message: "Form not found" });

    if (form[0].teacher_id !== teacherId)
      return res.status(403).json({ success: false, message: "Not authorized" });

    // 3) Construct update query dynamically
    const allowedFields = [
      'first_name', 'middle_name', 'last_name', 'dob', 'gender', 'blood_group',
      'photo', 'father_name', 'mother_name', 'street_address', 'city', 'state',
      'pin_code', 'emergency_contact', 'parent_name', 'parent_phone', 'parent_email',
      'roll_number', 'status', 'father_phone', 'mother_phone', 'division_id',
      'id_number', 'gr_number', 'sr_number', 'admission_number', 'registration_number',
      'bus_number', 'father_occupation', 'father_office_address', 'father_photo',
      'mother_occupation', 'mother_office_address', 'mother_photo', 'guardian_name',
      'guardian_contact', 'guardian_occupation', 'guardian_office_address',
      'guardian_photo', 'guardian_relation', 'mother_email', 'father_email',
      'guardian_email'
    ];

    // Map common camelCase fields from frontend to snake_case
    const mapping = {
      'rollNo': 'roll_number',
      'fatherName': 'father_name',
      'motherName': 'mother_name',
      'father_phone': 'father_phone', // Ensure these are allowed
      'mother_phone': 'mother_phone'
    };

    const finalUpdateData = {};

    // -----------------------------
    // Handle photo uploads (If any)
    // -----------------------------
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    if (req.files) {
      if (req.files.photo) {
        finalUpdateData.photo = `${backendUrl}/uploads/${req.files.photo[0].filename}`;
      }
      if (req.files.father_photo) {
        finalUpdateData.father_photo = `${backendUrl}/uploads/${req.files.father_photo[0].filename}`;
      }
      if (req.files.mother_photo) {
        finalUpdateData.mother_photo = `${backendUrl}/uploads/${req.files.mother_photo[0].filename}`;
      }
      if (req.files.guardian_photo) {
        finalUpdateData.guardian_photo = `${backendUrl}/uploads/${req.files.guardian_photo[0].filename}`;
      }
    }

    Object.keys(updateData).forEach(key => {
      const dbKey = mapping[key] || key;

      // IF a new file was uploaded for this field, skip the text value from body
      if (req.files && req.files[dbKey]) return;

      if (allowedFields.includes(dbKey)) {
        let value = updateData[key];

        // Handle arrays (duplicate keys in FormData)
        if (Array.isArray(value)) {
          value = value[value.length - 1];
        }

        // Sanitization for integer fields like roll_number
        if (dbKey === 'roll_number') {
          if (value === 'N/A' || value === '' || value === undefined || value === 'null') {
            value = null;
          } else if (value !== null && !isNaN(value)) {
            value = parseInt(value, 10);
          } else if (typeof value === 'string' && value.trim() === '') {
            value = null;
          }
        }

        finalUpdateData[dbKey] = value;
      }
    });

    const fields = Object.keys(finalUpdateData);
    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }

    const setClause = fields.map(field => `"${field}" = :${field}`).join(', ');

    await sequelize.query(
      `UPDATE student_forms 
       SET ${setClause}, updated_at = NOW() 
       WHERE id = :id`,
      {
        replacements: { ...finalUpdateData, id },
        type: QueryTypes.UPDATE
      }
    );

    // 4) Fetch and return the updated record (exclude password)
    const [updatedForm] = await sequelize.query(
      `SELECT sf.*, c.class_name, d.division_name, d.class_teacher
       FROM student_forms sf
       LEFT JOIN divisions d ON sf.division_id = d.id
       LEFT JOIN classes c ON d.class_id = c.id
       WHERE sf.id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (updatedForm && updatedForm.password) delete updatedForm.password;

    return res.json({
      success: true,
      message: "Student details updated successfully",
      data: updatedForm
    });
  } catch (err) {
    console.error("🔥 Error in updateStudentForm:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getStudentForms, updateFormStatus, requestCorrection, updateStudentForm };
