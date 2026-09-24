const crypto = require('crypto');
const sequelize = require('../../config/db');
const { QueryTypes } = require('sequelize');
const FormLink = require('../../backend-teacher/models/FormLink');
const { Op } = require('sequelize');

// Get form with field-level correction data
exports.getFormWithCorrections = async (req, res) => {
  try {
    const schoolAdminId = req.user?.school_id;
    const { formId } = req.params;

    const form = await sequelize.query(
      `SELECT 
        *,
        fields_requiring_correction,
        correction_field_notes,
        correction_notes,
        requires_correction,
        revision_number,
        individual_form_token
       FROM student_forms 
       WHERE id = :formId AND school_id = :schoolId`,
      { replacements: { formId, schoolId: schoolAdminId }, type: QueryTypes.SELECT }
    );

    if (!form.length) {
      return res.status(404).json({ success: false, message: 'Form not found' });
    }

    res.json({
      success: true,
      data: form[0]
    });
  } catch (error) {
    console.error('Get form error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Mark specific fields for correction
exports.markFieldsForCorrection = async (req, res) => {
  try {
    const schoolAdminId = req.user?.school_id;
    const { formId } = req.params;
    const {
      fields_requiring_correction,  // { "first_name": true, "dob": true, ... }
      correction_field_notes,       // { "first_name": "Note here", ... }
      general_notes
    } = req.body;

    // Verify form belongs to school
    const form = await sequelize.query(
      `SELECT * FROM student_forms WHERE id = :formId AND school_id = :schoolId`,
      { replacements: { formId, schoolId: schoolAdminId }, type: QueryTypes.SELECT }
    );

    if (!form.length) {
      return res.status(404).json({ success: false, message: 'Form not found' });
    }

    // Generate unique individual form token
    const individualToken = crypto.randomBytes(16).toString('hex');

    // Get form link token
    const formLink = await FormLink.findOne({
      where: {
        school_id: schoolAdminId,
        class_name: form[0].class_name,
        division: form[0].division_name || form[0].division
      }
    });

    const formLinkToken = formLink ? formLink.token : null;

    // Update form with field-level corrections
    const updateQuery = `
      UPDATE student_forms 
      SET 
        fields_requiring_correction = :fields_requiring_correction::jsonb,
        correction_field_notes = :correction_field_notes::jsonb,
        correction_notes = :general_notes,
        requires_correction = true,
        individual_form_token = :individual_token,
        form_link_token = COALESCE(:form_link_token, form_link_token),
        is_active = true,
        status = 'submitted',
        revision_number = COALESCE(revision_number, 0) + 1,
        correction_sent_at = NOW(),
        updated_at = NOW()
      WHERE id = :formId
      RETURNING *;
    `;

    const result = await sequelize.query(updateQuery, {
      replacements: {
        formId,
        fields_requiring_correction: JSON.stringify(fields_requiring_correction || {}),
        correction_field_notes: JSON.stringify(correction_field_notes || {}),
        general_notes: general_notes || null,
        individual_token: individualToken,
        form_link_token: formLinkToken
      },
      type: QueryTypes.UPDATE
    });

    // Generate individual correction link
    const baseToken = formLinkToken || individualToken;
    const revision = (form[0].revision_number || 0) + 1;
    const correctionLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/public-form/${baseToken}?formId=${formId}&revision=${revision}&token=${individualToken}`;

    res.json({
      success: true,
      message: 'Fields marked for correction',
      data: {
        form: result[0][0],
        correction_link: correctionLink,
        individual_token: individualToken
      }
    });
  } catch (error) {
    console.error('Mark fields for correction error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Send individual correction link to parent
exports.sendIndividualCorrectionLink = async (req, res) => {
  try {
    const schoolAdminId = req.user?.school_id;
    const { formId } = req.params;
    const { send_via } = req.body; // 'email', 'whatsapp', 'sms', 'link'

    // Get form with parent contact info
    const form = await sequelize.query(
      `SELECT 
        sf.*,
        fl.token as form_link_token
       FROM student_forms sf
       LEFT JOIN form_links fl ON sf.form_link_token = fl.token
       WHERE sf.id = :formId AND sf.school_id = :schoolId`,
      { replacements: { formId, schoolId: schoolAdminId }, type: QueryTypes.SELECT }
    );

    if (!form.length) {
      return res.status(404).json({ success: false, message: 'Form not found' });
    }

    const formData = form[0];
    const individualToken = formData.individual_form_token || crypto.randomBytes(16).toString('hex');
    const baseToken = formData.form_link_token || individualToken;
    const revision = formData.revision_number || 1;

    // Generate correction link
    const correctionLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/public-form/${baseToken}?formId=${formId}&revision=${revision}&token=${individualToken}`;

    // Update form with send info
    await sequelize.query(
      `UPDATE student_forms 
       SET 
         individual_form_token = COALESCE(individual_form_token, :token),
         correction_sent_at = NOW(),
         correction_sent_via = :send_via
       WHERE id = :formId`,
      {
        replacements: { formId, token: individualToken, send_via: send_via || 'link' },
        type: QueryTypes.UPDATE
      }
    );

    // For now, just return the link (WhatsApp/Email integration will be added later)
    let sendResult = null;
    if (send_via === 'link' || !send_via) {
      sendResult = { method: 'link', link: correctionLink };
    } else {
      // TODO: Implement email/WhatsApp/SMS sending
      sendResult = {
        method: send_via,
        sent: false,
        message: `${send_via} integration coming soon`,
        link: correctionLink
      };
    }

    res.json({
      success: true,
      message: `Correction link ${send_via === 'link' ? 'generated' : 'prepared for sending'}`,
      data: {
        correction_link: correctionLink,
        individual_token: individualToken,
        send_result: sendResult
      }
    });
  } catch (error) {
    console.error('Send correction link error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update student form (School Admin can edit)
exports.updateStudentForm = async (req, res) => {
  try {
    const schoolAdminId = req.user?.school_id;
    const { formId } = req.params;
    const updateData = { ...req.body };
    const { dob } = updateData;

    // Normalize DOB if present
    if (dob) {
      try {
        const dateObj = new Date(dob);
        if (!isNaN(dateObj.getTime())) {
          updateData.dob = dateObj.toISOString().split('T')[0];
        }
      } catch (e) {
        console.warn("Date parsing failed for:", dob);
      }
    }

    // Verify form belongs to school
    const form = await sequelize.query(
      `SELECT * FROM student_forms WHERE id = :formId AND school_id = :schoolId`,
      { replacements: { formId, schoolId: schoolAdminId }, type: QueryTypes.SELECT }
    );

    if (!form.length) {
      return res.status(404).json({ success: false, message: 'Form not found' });
    }

    // Update form with admin edit flag
    const updateQuery = `
      UPDATE student_forms 
      SET 
        first_name = COALESCE(:first_name, first_name),
        last_name = COALESCE(:last_name, last_name),
        dob = COALESCE(:dob, dob),
        gender = COALESCE(:gender, gender),
        blood_group = COALESCE(:blood_group, blood_group),
        father_name = COALESCE(:father_name, father_name),
        father_phone = COALESCE(:father_phone, father_phone),
        mother_name = COALESCE(:mother_name, mother_name),
        mother_phone = COALESCE(:mother_phone, mother_phone),
        street_address = COALESCE(:street_address, street_address),
        city = COALESCE(:city, city),
        state = COALESCE(:state, state),
        pin_code = COALESCE(:pin_code, pin_code),
        emergency_contact = COALESCE(:emergency_contact, emergency_contact),
        parent_name = COALESCE(:parent_name, parent_name),
        parent_phone = COALESCE(:parent_phone, parent_phone),
        parent_email = COALESCE(:parent_email, parent_email),
        edited_by_school_admin = true,
        edited_by_admin_id = :adminId,
        last_edited_at = NOW(),
        requires_correction = COALESCE(:requires_correction, requires_correction),
        correction_notes = COALESCE(:correction_notes, correction_notes),
        updated_at = NOW()
      WHERE id = :formId
      RETURNING *;
    `;

    const result = await sequelize.query(updateQuery, {
      replacements: {
        formId,
        adminId: schoolAdminId,
        ...updateData,
        requires_correction: updateData.requires_correction !== undefined ? updateData.requires_correction : form[0].requires_correction,
        correction_notes: updateData.correction_notes !== undefined ? updateData.correction_notes : form[0].correction_notes
      },
      type: QueryTypes.UPDATE
    });

    res.json({
      success: true,
      message: 'Form updated successfully',
      data: result[0][0]
    });
  } catch (error) {
    console.error('Update form error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete student forms (Bulk)
exports.deleteStudentForms = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const schoolAdminId = req.user?.school_id;
    const { ids } = req.body; // Expecting an array of IDs

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'No student IDs provided' });
    }

    // Verify all forms belong to school
    const forms = await sequelize.query(
      `SELECT id FROM student_forms WHERE id IN (:ids) AND school_id = :schoolId`,
      { replacements: { ids, schoolId: schoolAdminId }, type: QueryTypes.SELECT, transaction }
    );

    if (forms.length !== ids.length) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete some or all of the selected forms'
      });
    }

    // Delete associated records from student_generated_ids first
    await sequelize.query(
      `DELETE FROM student_generated_ids WHERE student_form_id IN (:ids)`,
      { replacements: { ids }, type: QueryTypes.DELETE, transaction }
    );

    // Delete the forms
    await sequelize.query(
      `DELETE FROM student_forms WHERE id IN (:ids)`,
      { replacements: { ids }, type: QueryTypes.DELETE, transaction }
    );

    await transaction.commit();

    res.json({
      success: true,
      message: `${ids.length} student forms and related IDs deleted successfully`
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Delete forms error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Activate/Deactivate form
exports.toggleFormActive = async (req, res) => {
  try {
    const schoolAdminId = req.user?.school_id;
    const { formId } = req.params;
    const { is_active } = req.body;

    await sequelize.query(
      `UPDATE student_forms 
       SET is_active = :is_active, updated_at = NOW()
       WHERE id = :formId AND school_id = :schoolId
       RETURNING *;`,
      {
        replacements: { formId, schoolId: schoolAdminId, is_active },
        type: QueryTypes.UPDATE
      }
    );

    res.json({
      success: true,
      message: `Form ${is_active ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Toggle form active error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

