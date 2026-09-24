// // backend-school/controllers/formLinkController.js
const FormLink = require('../models/FormLink');
const crypto = require('crypto');
const { Op } = require('sequelize');
const sequelize = require('../../config/db');
const { QueryTypes } = require('sequelize');
const { linkStudentToParentAccount } = require('../../utils/parentAccountLinker');

// Generate a unique token
const generateToken = () => crypto.randomBytes(16).toString('hex');

// ========================
// 1) CREATE FORM LINK (For Teacher)
// ========================
exports.createFormLink = async (req, res) => {
  try {
    const teacherId = req.user?.id;
    const { class_name, division } = req.body;

    if (!teacherId) {
      return res.status(401).json({ success: false, message: 'Teacher authentication required' });
    }

    if (!class_name || !division) {
      return res.status(400).json({ success: false, message: 'Class name and division are required' });
    }

    // Get teacher's school_id
    const teacher = await sequelize.query(
      'SELECT school_id, name FROM teachers WHERE id = :teacherId',
      { replacements: { teacherId }, type: QueryTypes.SELECT }
    );

    if (!teacher.length) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const school_id = teacher[0].school_id;
    const teacherName = teacher[0].name;

    // Verify teacher is assigned to this class/division
    const division_check = await sequelize.query(
      `SELECT id FROM divisions
             WHERE LOWER(class_name) = LOWER(:class_name)
             AND LOWER(division_name) = LOWER(:division)
             AND teacher_id = :teacherId`,
      { replacements: { class_name, division, teacherId }, type: QueryTypes.SELECT }
    );

    if (!division_check.length) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this class/division'
      });
    }

    // Check if a link already exists for this class/division
    const existingLink = await FormLink.findOne({
      where: {
        school_id,
        class_name,
        division,
        is_active: true
      }
    });

    if (existingLink) {
      // Return existing link
      const publicLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/public-form/${existingLink.token}`;
      return res.status(200).json({
        success: true,
        message: 'Form link already exists',
        link: publicLink,
        data: existingLink
      });
    }

    // Create new link
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 365); // link valid for 1 year

    const link = await FormLink.create({
      token,
      school_id,
      teacher_id: teacherId,
      class_name,
      division,
      expires_at: expiresAt,
      is_active: true
    });

    const publicLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/public-form/${token}`;

    res.status(201).json({
      success: true,
      message: 'Form link generated successfully',
      link: publicLink,
      data: link
    });
  } catch (err) {
    console.error('Error creating form link:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ========================
// 2) GET FORM LINK INFO (Public - No Auth Required)
// ========================
exports.getFormLinkInfo = async (req, res) => {
  try {
    const { token } = req.params;
    const { formId, revision, token: individualToken } = req.query;

    // Check if token exists and is valid
    const formLink = await FormLink.findOne({
      where: {
        token,
        is_active: true,
        expires_at: { [Op.gt]: new Date() }
      }
    });

    if (!formLink) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired form link'
      });
    }

    let existingFormData = null;
    let fieldsRequiringCorrection = null;
    let correctionFieldNotes = null;
    let correctionNotes = null;
    let requiresCorrection = false;

    // If formId provided, fetch existing form data with corrections
    if (formId) {
      const existingForm = await sequelize.query(
        `SELECT 
                  *,
                  fields_requiring_correction,
                  correction_field_notes,
                  correction_notes,
                  requires_correction
                 FROM student_forms 
                 WHERE id = :formId 
                 AND (form_link_token = :token OR individual_form_token = :individualToken)`,
        {
          replacements: {
            formId,
            token: formLink.token,
            individualToken: individualToken || null
          },
          type: QueryTypes.SELECT
        }
      );

      if (existingForm.length) {
        const form = existingForm[0];
        existingFormData = {
          roll_number: form.roll_number,
          id_no: form.id_number,
          gr_no: form.gr_number,
          sr_no: form.sr_number,
          admission_no: form.admission_number,
          register_no: form.registration_number,
          bus_no: form.bus_number,
          first_name: form.first_name,
          middle_name: form.middle_name,
          last_name: form.last_name,
          dob: form.dob,
          gender: form.gender,
          blood_group: form.blood_group,
          photo: form.photo,
          father_name: form.father_name,
          father_phone: form.father_phone,
          father_email: form.father_email,
          father_occupation: form.father_occupation,
          father_office_address: form.father_office_address,
          father_photo: form.father_photo,
          mother_name: form.mother_name,
          mother_phone: form.mother_phone,
          mother_email: form.mother_email,
          mother_occupation: form.mother_occupation,
          mother_office_address: form.mother_office_address,
          mother_photo: form.mother_photo,
          guardian_name: form.guardian_name,
          guardian_phone: form.guardian_contact,
          guardian_email: form.guardian_email,
          guardian_occupation: form.guardian_occupation,
          guardian_office_address: form.guardian_office_address,
          guardian_photo: form.guardian_photo,
          guardian_relation: form.guardian_relation,
          street_address: form.street_address,
          city: form.city,
          state: form.state,
          pin_code: form.pin_code,
          emergency_contact: form.emergency_contact,
          parent_name: form.parent_name,
          parent_phone: form.parent_phone,
          parent_email: form.parent_email,
        };

        fieldsRequiringCorrection = form.fields_requiring_correction || {};
        correctionFieldNotes = form.correction_field_notes || {};
        correctionNotes = form.correction_notes;
        requiresCorrection = form.requires_correction || false;
      }
    }

    // Return form link info (without sensitive data)
    res.json({
      success: true,
      data: {
        class_name: formLink.class_name,
        division: formLink.division,
        school_id: formLink.school_id,
        existing_form: existingFormData,
        fields_requiring_correction: fieldsRequiringCorrection,
        correction_field_notes: correctionFieldNotes,
        correction_notes: correctionNotes,
        requires_correction: requiresCorrection
      }
    });
  } catch (err) {
    console.error('Error getting form link info:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ========================
// 3) SUBMIT FORM VIA PUBLIC LINK (No Auth Required)
// ========================
exports.submitFormViaLink = async (req, res) => {
  console.log('📝 Form submission received for token:', req.params.token);

  try {
    const { token: form_token } = req.params;
    const { formId, token: individualToken } = req.query;

    const {
      roll_number,
      id_number,
      gr_number,
      sr_number,
      admission_number,
      registration_number,
      bus_number,
      first_name,
      middle_name,
      last_name,
      dob,
      gender,
      blood_group,
      photo,
      father_name,
      father_phone,
      father_email,
      father_occupation,
      father_office_address,
      father_photo,
      mother_name,
      mother_phone,
      mother_email,
      mother_occupation,
      mother_office_address,
      mother_photo,
      guardian_name,
      guardian_contact,
      guardian_occupation,
      guardian_office_address,
      guardian_photo,
      guardian_relation,
      guardian_email,
      street_address,
      city,
      state,
      pin_code,
      emergency_contact,
      parent_name,
      parent_phone,
      parent_email,
    } = req.body;

    // -----------------------------
    // Handle photo uploads (Multiple files)
    // -----------------------------
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';

    let photoPath = photo || null;
    let fatherPhotoPath = father_photo || null;
    let motherPhotoPath = mother_photo || null;
    let guardianPhotoPath = guardian_photo || null;

    if (req.files) {
      if (req.files.photo) {
        photoPath = `${backendUrl}/uploads/${req.files.photo[0].filename}`;
      }
      if (req.files.father_photo) {
        fatherPhotoPath = `${backendUrl}/uploads/${req.files.father_photo[0].filename}`;
      }
      if (req.files.mother_photo) {
        motherPhotoPath = `${backendUrl}/uploads/${req.files.mother_photo[0].filename}`;
      }
      if (req.files.guardian_photo) {
        guardianPhotoPath = `${backendUrl}/uploads/${req.files.guardian_photo[0].filename}`;
      }
    }

    // -----------------------------
    // Validate form link token
    // -----------------------------
    const formLink = await FormLink.findOne({
      where: {
        token: form_token,
        is_active: true,
        expires_at: { [Op.gt]: new Date() },
      },
    });

    if (!formLink) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired form link',
      });
    }

    // -----------------------------
    // Required fields (roll_number OPTIONAL)
    // -----------------------------
    const requiredFields = {
      first_name,
      last_name,
      dob,
      gender,
      father_name,
      mother_name,
      street_address,
      city,
      state,
      pin_code,
      emergency_contact,
      parent_phone,
      parent_email,
    };

    const missing = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missing_fields: missing,
      });
    }

    // -----------------------------
    // Get teacher name
    // -----------------------------
    const teacherResult = await sequelize.query(
      `SELECT name FROM teachers WHERE id = :teacher_id`,
      {
        replacements: { teacher_id: formLink.teacher_id },
        type: QueryTypes.SELECT,
      }
    );

    if (!teacherResult.length) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const teacherName = teacherResult[0].name;

    // -----------------------------
    // Get division_id
    // -----------------------------
    const divisionResult = await sequelize.query(
      `SELECT id FROM divisions
       WHERE LOWER(class_name) = LOWER(:class_name)
       AND LOWER(division_name) = LOWER(:division)
       AND teacher_id = :teacher_id`,
      {
        replacements: {
          class_name: formLink.class_name,
          division: formLink.division,
          teacher_id: formLink.teacher_id,
        },
        type: QueryTypes.SELECT,
      }
    );

    if (!divisionResult.length) {
      return res.status(404).json({
        success: false,
        message: 'Class/Division not found for this teacher',
      });
    }

    const division_id = divisionResult[0].id;

    // -----------------------------
    // Get class_id
    // -----------------------------
    const classResult = await sequelize.query(
      `SELECT id FROM classes
       WHERE LOWER(class_name) = LOWER(:class_name)
       AND school_id = :school_id`,
      {
        replacements: {
          class_name: formLink.class_name,
          school_id: formLink.school_id,
        },
        type: QueryTypes.SELECT,
      }
    );

    if (!classResult.length) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    const class_id = classResult[0].id;

    // =====================================================
    // REVISION FLOW (UPDATE)
    // =====================================================
    if (formId) {
      const existingForm = await sequelize.query(
        `SELECT id FROM student_forms
         WHERE id = :formId
         AND (form_link_token = :token OR individual_form_token = :individualToken)`,
        {
          replacements: {
            formId,
            token: formLink.token,
            individualToken: individualToken || null,
          },
          type: QueryTypes.SELECT,
        }
      );

      if (!existingForm.length) {
        return res.status(404).json({
          success: false,
          message: 'Form not found or invalid revision token',
        });
      }

      const updateQuery = `
        UPDATE student_forms
        SET
          roll_number = COALESCE(:roll_number, roll_number),
          id_number = :id_number,
          gr_number = :gr_number,
          sr_number = :sr_number,
          admission_number = :admission_number,
          registration_number = :registration_number,
          bus_number = :bus_number,
          first_name = :first_name,
          middle_name = :middle_name,
          last_name = :last_name,
          dob = :dob,
          gender = :gender,
          blood_group = :blood_group,
          photo = COALESCE(:photo, photo),
          father_name = :father_name,
          father_phone = :father_phone,
          father_email = :father_email,
          father_occupation = :father_occupation,
          father_office_address = :father_office_address,
          father_photo = COALESCE(:father_photo, father_photo),
          mother_name = :mother_name,
          mother_phone = :mother_phone,
          mother_email = :mother_email,
          mother_occupation = :mother_occupation,
          mother_office_address = :mother_office_address,
          mother_photo = COALESCE(:mother_photo, mother_photo),
          guardian_name = :guardian_name,
          guardian_contact = :guardian_contact,
          guardian_occupation = :guardian_occupation,
          guardian_office_address = :guardian_office_address,
          guardian_photo = COALESCE(:guardian_photo, guardian_photo),
          guardian_relation = :guardian_relation,
          guardian_email = :guardian_email,
          street_address = :street_address,
          city = :city,
          state = :state,
          pin_code = :pin_code,
          emergency_contact = :emergency_contact,
          parent_name = :parent_name,
          parent_phone = :parent_phone,
          parent_email = :parent_email,
          requires_correction = false,
          fields_requiring_correction = '{}'::jsonb,
          correction_field_notes = '{}'::jsonb,
          parent_submission_count = COALESCE(parent_submission_count, 0) + 1,
          status = 'submitted',
          updated_at = NOW()
        WHERE id = :formId
        RETURNING *;
      `;

      const result = await sequelize.query(updateQuery, {
        replacements: {
          formId,
          roll_number: roll_number || null,
          id_number: id_number || null,
          gr_number: gr_number || null,
          sr_number: sr_number || null,
          admission_number: admission_number || null,
          registration_number: registration_number || null,
          bus_number: bus_number || null,
          first_name,
          middle_name: middle_name || null,
          last_name,
          dob,
          gender,
          blood_group: blood_group || null,
          photo: photoPath,
          father_name,
          father_phone: father_phone || null,
          father_email: father_email || null,
          father_occupation: father_occupation || null,
          father_office_address: father_office_address || null,
          father_photo: fatherPhotoPath,
          mother_name,
          mother_phone: mother_phone || null,
          mother_email: mother_email || null,
          mother_occupation: mother_occupation || null,
          mother_office_address: mother_office_address || null,
          mother_photo: motherPhotoPath,
          guardian_name: guardian_name || null,
          guardian_contact: guardian_contact || null,
          guardian_occupation: guardian_occupation || null,
          guardian_office_address: guardian_office_address || null,
          guardian_photo: guardianPhotoPath,
          guardian_relation: guardian_relation || null,
          guardian_email: guardian_email || null,
          street_address,
          city,
          state,
          pin_code,
          emergency_contact,
          parent_name: parent_name || null,
          parent_phone,
          parent_email,
        },
        type: QueryTypes.UPDATE,
      });

      return res.status(200).json({
        success: true,
        message: 'Form updated successfully',
        data: result[0][0],
      });
    }

    // =====================================================
    // DUPLICATE CHECK (GR NUMBER)
    // =====================================================
    if (gr_number) {
      const grCheck = await sequelize.query(
        `SELECT id FROM student_forms 
         WHERE school_id = :school_id 
         AND LOWER(gr_number) = LOWER(:gr_number)
         ${formId ? 'AND id != :formId' : ''}`,
        {
          replacements: {
            school_id: formLink.school_id,
            gr_number: gr_number.toString().trim(),
            formId: formId || null
          },
          type: QueryTypes.SELECT
        }
      );

      if (grCheck.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'A student with this GR Number already exists in this school'
        });
      }
    }

    // =====================================================
    // INSERT NEW FORM
    // =====================================================
    const insertQuery = `
      INSERT INTO student_forms (
        class_id,
        division_id,
        school_id,
        teacher_id,
        roll_number,
        id_number,
        gr_number,
        sr_number,
        admission_number,
        registration_number,
        bus_number,
        first_name,
        middle_name,
        last_name,
        dob,
        gender,
        blood_group,
        photo,
        father_name,
        father_phone,
        father_email,
        father_occupation,
        father_office_address,
        father_photo,
        mother_name,
        mother_phone,
        mother_email,
        mother_occupation,
        mother_office_address,
        mother_photo,
        guardian_name,
        guardian_contact,
        guardian_occupation,
        guardian_office_address,
        guardian_photo,
        guardian_relation,
        guardian_email,
        street_address,
        city,
        state,
        pin_code,
        emergency_contact,
        parent_name,
        parent_phone,
        parent_email,
        status,
        form_token
      )
      VALUES (
        :class_id, :division_id, :school_id, :teacher_id, :roll_number,
        :id_number, :gr_number, :sr_number, :admission_number, :registration_number, :bus_number,
        :first_name, :middle_name, :last_name, :dob, :gender, :blood_group, :photo,
        :father_name, :father_phone, :father_email, :father_occupation, :father_office_address, :father_photo,
        :mother_name, :mother_phone, :mother_email, :mother_occupation, :mother_office_address, :mother_photo,
        :guardian_name, :guardian_contact, :guardian_occupation, :guardian_office_address, :guardian_photo, :guardian_relation, :guardian_email,
        :street_address, :city, :state, :pin_code, :emergency_contact,
        :parent_name, :parent_phone, :parent_email, 'submitted', :form_token
      )
      RETURNING *;
    `;

    const result = await sequelize.query(insertQuery, {
      replacements: {
        class_id,
        division_id,
        school_id: formLink.school_id,
        teacher_id: formLink.teacher_id,
        roll_number: roll_number || null,
        id_number: id_number || null,
        gr_number: gr_number || null,
        sr_number: sr_number || null,
        admission_number: admission_number || null,
        registration_number: registration_number || null,
        bus_number: bus_number || null,
        first_name,
        middle_name: middle_name || null,
        last_name,
        dob,
        gender,
        blood_group: blood_group || null,
        photo: photoPath,
        father_name,
        father_phone: father_phone || null,
        father_email: father_email || null,
        father_occupation: father_occupation || null,
        father_office_address: father_office_address || null,
        father_photo: fatherPhotoPath,
        mother_name,
        mother_phone: mother_phone || null,
        mother_email: mother_email || null,
        mother_occupation: mother_occupation || null,
        mother_office_address: mother_office_address || null,
        mother_photo: motherPhotoPath,
        guardian_name: guardian_name || null,
        guardian_contact: guardian_contact || null,
        guardian_occupation: guardian_occupation || null,
        guardian_office_address: guardian_office_address || null,
        guardian_photo: guardianPhotoPath,
        guardian_relation: guardian_relation || null,
        guardian_email: guardian_email || null,
        street_address,
        city,
        state,
        pin_code,
        emergency_contact,
        parent_name: parent_name || null,
        parent_phone,
        parent_email,
        form_token: formLink.token,
      },
      type: QueryTypes.INSERT,
    });

    const insertedStudent = result[0][0];
    if (insertedStudent) {
      try {
        await linkStudentToParentAccount(insertedStudent);
      } catch (linkErr) {
        console.warn("Parent account link skipped for new form", linkErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Form submitted successfully',
      data: insertedStudent,
    });

  } catch (err) {
    console.error('🔥 Error submitting form:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while submitting form',
    });
  }
};

// ========================
// 4) GET TEACHER'S FORM LINKS
// ========================
exports.getFormLinks = async (req, res) => {
  try {
    const teacherId = req.user?.id;

    if (!teacherId) {
      return res.status(401).json({ success: false, message: 'Teacher authentication required' });
    }

    // Get teacher's school_id
    const teacher = await sequelize.query(
      'SELECT school_id, name FROM teachers WHERE id = :teacherId',
      { replacements: { teacherId }, type: QueryTypes.SELECT }
    );

    if (!teacher.length) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const teacherName = teacher[0].name;
    const schoolId = teacher[0].school_id;

    // Get divisions assigned to this teacher
    console.log('🔍 Looking for divisions assigned to teacher ID:', teacherId);
    const divisions = await sequelize.query(
      `SELECT DISTINCT d.class_name, d.division_name
       FROM divisions d
       JOIN classes c ON d.class_id = c.id
       WHERE d.teacher_id = :teacherId AND c.school_id = :schoolId`,
      { replacements: { teacherId, schoolId }, type: QueryTypes.SELECT }
    );
    console.log('📚 Found divisions:', divisions.length, divisions);

    // Auto-generate links for all divisions if they don't exist
    for (const div of divisions) {
      const existingLink = await FormLink.findOne({
        where: {
          school_id: schoolId,
          class_name: div.class_name,
          division: div.division_name,
          is_active: true
        }
      });

      if (!existingLink) {
        // Generate new link
        const token = crypto.randomBytes(16).toString('hex');
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year expiration

        await FormLink.create({
          school_id: schoolId,
          class_name: div.class_name,
          division: div.division_name,
          token: token,
          expires_at: expiresAt,
          teacher_id: teacherId,
          is_active: true
        });
      }
    }

    // Get all form links for teacher's divisions
    const links = await FormLink.findAll({
      where: {
        teacher_id: teacherId,
        is_active: true
      },
      order: [['created_at', 'DESC']]
    });

    // Add full URL to each link
    const linksWithUrl = links.map(link => ({
      ...link.toJSON(),
      full_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/public-form/${link.token}`
    }));

    res.json({
      success: true,
      data: {
        links: linksWithUrl,
        divisions: divisions
      }
    });
  } catch (err) {
    console.error('Error getting form links:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ========================
// 5) DEACTIVATE FORM LINK
// ========================
exports.deactivateFormLink = async (req, res) => {
  try {
    const teacherId = req.user?.id;
    const { token } = req.params;

    if (!teacherId) {
      return res.status(401).json({ success: false, message: 'Teacher authentication required' });
    }

    const formLink = await FormLink.findOne({
      where: {
        token,
        teacher_id: teacherId
      }
    });

    if (!formLink) {
      return res.status(404).json({ success: false, message: 'Form link not found' });
    }

    formLink.is_active = false;
    await formLink.save();

    res.json({
      success: true,
      message: 'Form link deactivated successfully'
    });
  } catch (err) {
    console.error('Error deactivating form link:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};