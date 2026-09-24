const { QueryTypes } = require('sequelize');
const sequelize = require('../../config/db');
const bcrypt = require('bcryptjs'); // <-- add this for password hashing

// ---------------- Add Teacher ----------------
exports.addTeacher = async (req, res) => {
  try {
    const { school_id, name, email, phone, subject, status, password } = req.body;

    if (!school_id || !name || !email || !password) {
      return res.status(400).json({ success: false, message: 'School ID, name, email, and password are required' });
    }

    // Email must be unique within the same school (multi-school teachers allowed)
    const existingEmail = await sequelize.query(
      `SELECT id FROM teachers WHERE LOWER(email) = LOWER(:email) AND school_id = :school_id LIMIT 1`,
      { replacements: { email: email.trim(), school_id }, type: QueryTypes.SELECT }
    );

    if (existingEmail.length > 0) {
      return res.status(409).json({ success: false, message: 'Email is already registered in this school' });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO teachers (school_id, name, email, phone, subject, status, password, created_at, updated_at)
      VALUES (:school_id, :name, :email, :phone, :subject, :status, :password, NOW(), NOW())
      RETURNING *;
    `;

    const replacements = {
      school_id,
      name,
      email: email || null,
      phone: phone || null,
      subject: subject || null,
      status: status || 'Active',
      password: hashedPassword
    };

    const [result] = await sequelize.query(query, { replacements, type: QueryTypes.INSERT });

    res.status(201).json({ success: true, message: ' Teacher added successfully', data: result[0] });

  } catch (error) {
    console.error('Add Teacher Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ---------------- Get All Teachers for a School ----------------
exports.getTeachers = async (req, res) => {
  try {
    const { school_id } = req.params;

    if (!school_id) {
      return res.status(400).json({ success: false, message: 'School ID is required' });
    }

    const teachers = await sequelize.query(
      `SELECT id, school_id, name, email, phone, subject, status, created_at, updated_at 
       FROM teachers WHERE school_id = :school_id ORDER BY id DESC`,
      { replacements: { school_id }, type: QueryTypes.SELECT }
    );

    res.status(200).json({ success: true, data: teachers });

  } catch (error) {
    console.error('Get Teachers Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ---------------- Update Teacher ----------------
exports.updateTeacher = async (req, res) => {
  try {
    const { teacher_id } = req.params;
    const { name, email, phone, subject, status, password } = req.body;
    const schoolId = req.user?.school_id;

    if (!teacher_id) {
      return res.status(400).json({ success: false, message: 'Teacher ID is required' });
    }

    // Verify teacher belongs to the school
    const teacherCheck = await sequelize.query(
      `SELECT id, school_id FROM teachers WHERE id = :teacher_id`,
      { replacements: { teacher_id }, type: QueryTypes.SELECT }
    );

    if (!teacherCheck.length) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    if (teacherCheck[0].school_id !== schoolId) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Teacher does not belong to your school' });
    }

    // Build update query dynamically
    const updates = [];
    const replacements = { teacher_id };

    if (name !== undefined) {
      updates.push('name = :name');
      replacements.name = name.trim();
    }
    if (email !== undefined) {
      if (email === null || email.trim() === '') {
        return res.status(400).json({ success: false, message: 'Email cannot be empty' });
      }

      // Check if email is already taken by another teacher in this school
      const [teacherRow] = await sequelize.query(
        `SELECT school_id FROM teachers WHERE id = :teacher_id LIMIT 1`,
        { replacements: { teacher_id }, type: QueryTypes.SELECT }
      );
      const teacherSchoolId = teacherRow?.school_id;

      const emailCheck = await sequelize.query(
        `SELECT id FROM teachers WHERE LOWER(email) = LOWER(:email) AND id != :teacher_id AND school_id = :school_id LIMIT 1`,
        { replacements: { email: email.trim(), teacher_id, school_id: teacherSchoolId }, type: QueryTypes.SELECT }
      );

      if (emailCheck.length > 0) {
        return res.status(409).json({ success: false, message: 'Email is already registered in this school' });
      }

      updates.push('email = :email');
      replacements.email = email.trim();
    }
    if (phone !== undefined) {
      updates.push('phone = :phone');
      replacements.phone = phone ? phone.trim() : null;
    }
    if (subject !== undefined) {
      updates.push('subject = :subject');
      replacements.subject = subject ? subject.trim() : null;
    }
    if (status !== undefined) {
      updates.push('status = :status');
      replacements.status = status;
    }
    if (password !== undefined && password !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = :password');
      replacements.password = hashedPassword;
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    updates.push('updated_at = NOW()');

    const query = `
      UPDATE teachers 
      SET ${updates.join(', ')}
      WHERE id = :teacher_id
      RETURNING id, school_id, name, email, phone, subject, status, created_at, updated_at;
    `;

    const [result] = await sequelize.query(query, { replacements, type: QueryTypes.UPDATE });

    res.status(200).json({ success: true, message: 'Teacher updated successfully', data: result[0] });

  } catch (error) {
    console.error('Update Teacher Error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating teacher' });
  }
};

// ---------------- Delete Teacher ----------------
exports.deleteTeacher = async (req, res) => {
  try {
    const { teacher_id } = req.params;
    const schoolId = req.user?.school_id;

    if (!teacher_id) {
      return res.status(400).json({ success: false, message: 'Teacher ID is required' });
    }

    // Verify teacher belongs to the school
    const teacherCheck = await sequelize.query(
      `SELECT id, school_id FROM teachers WHERE id = :teacher_id`,
      { replacements: { teacher_id }, type: QueryTypes.SELECT }
    );

    if (!teacherCheck.length) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    if (teacherCheck[0].school_id !== schoolId) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Teacher does not belong to your school' });
    }

    // Check if teacher is assigned to any division
    const divisionCheck = await sequelize.query(
      `SELECT id FROM divisions WHERE teacher_id = :teacher_id LIMIT 1`,
      { replacements: { teacher_id }, type: QueryTypes.SELECT }
    );

    if (divisionCheck.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete teacher: Teacher is assigned to a division. Please reassign the division first.'
      });
    }

    await sequelize.query(
      `DELETE FROM teachers WHERE id = :teacher_id`,
      { replacements: { teacher_id }, type: QueryTypes.DELETE }
    );

    res.status(200).json({ success: true, message: 'Teacher deleted successfully' });

  } catch (error) {
    console.error('Delete Teacher Error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting teacher' });
  }
};

// ---------------- Import Teachers from Excel ----------------
const xlsx = require('xlsx');
const fs = require('fs');

exports.importTeachersFromExcel = async (req, res) => {
  let filePath = null;
  const t = await sequelize.transaction();
  try {
    const school_id = req.user?.school_id;

    if (!req.file) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!data.length) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Excel sheet is empty" });
    }

    // Expected Headers (Keys in JSON object)
    // Case-insensitive check helper
    const getField = (row, key) => {
      const keys = Object.keys(row);
      const match = keys.find(k => k.toLowerCase().trim() === key.toLowerCase());
      return match ? row[match] : null;
    };

    // Existing emails in this school only (same email allowed across schools)
    const existingTeachers = await sequelize.query(
      `SELECT email FROM teachers WHERE school_id = :school_id`,
      { replacements: { school_id }, type: QueryTypes.SELECT, transaction: t }
    );
    const existingEmails = new Set(
      existingTeachers.map((row) => String(row.email || '').toLowerCase()).filter(Boolean)
    );
    const emailsInSheet = new Set();

    const teachersToInsert = [];
    const errors = [];

    let rowIndex = 2; // Rows start at 2 (1 is header)
    for (const row of data) {
      const name = getField(row, 'name');
      const email = getField(row, 'email');
      const phone = getField(row, 'phone');
      const subject = getField(row, 'subject');
      const status = getField(row, 'status');
      const password = getField(row, 'password');

      const rowErrors = [];

      // Validate name
      let nameVal = '';
      if (name === undefined || name === null || name.toString().trim() === '') {
        rowErrors.push("Name is required");
      } else {
        nameVal = name.toString().trim();
        if (nameVal.length < 2) {
          rowErrors.push("Name must be at least 2 characters long");
        }
      }

      // Validate email
      let emailVal = '';
      if (email === undefined || email === null || email.toString().trim() === '') {
        rowErrors.push("Email is required");
      } else {
        emailVal = email.toString().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailVal)) {
          rowErrors.push("Email must be a valid email address");
        } else {
          const lowerEmail = emailVal.toLowerCase();
          if (existingEmails.has(lowerEmail)) {
            rowErrors.push(`Email (${emailVal}) is already registered in this school`);
          } else if (emailsInSheet.has(lowerEmail)) {
            rowErrors.push(`Email (${emailVal}) is duplicated in this file`);
          } else {
            emailsInSheet.add(lowerEmail);
          }
        }
      }

      // Validate phone (optional but must be 10 digits if provided)
      let phoneVal = '';
      if (phone !== undefined && phone !== null && phone.toString().trim() !== '' && phone.toString().trim() !== '-') {
        phoneVal = phone.toString().trim().replace(/\D/g, ''); // strip non-digits
        if (phoneVal.length !== 10) {
          rowErrors.push("Phone must be a valid 10-digit number");
        }
      }

      // Validate subject (optional)
      const subjectVal = (subject !== undefined && subject !== null) ? subject.toString().trim() : '';

      // Validate status (optional, default Active)
      let statusVal = 'Active';
      if (status !== undefined && status !== null && status.toString().trim() !== '') {
        const rawStatus = status.toString().trim().toLowerCase();
        if (rawStatus.includes('inactive') || rawStatus === '0' || rawStatus === 'false') {
          statusVal = 'Inactive';
        }
      }

      // Validate password
      let passwordVal = '';
      if (password === undefined || password === null || password.toString().trim() === '') {
        rowErrors.push("Password is required");
      } else {
        passwordVal = password.toString().trim();
        if (passwordVal.length < 6) {
          rowErrors.push("Password must be at least 6 characters long");
        }
      }

      if (rowErrors.length > 0) {
        errors.push({
          row: rowIndex,
          errors: rowErrors
        });
      } else {
        const hashedPassword = await bcrypt.hash(passwordVal, 10);
        teachersToInsert.push({
          school_id,
          name: nameVal,
          email: emailVal,
          phone: phoneVal || null,
          subject: subjectVal || null,
          status: statusVal,
          password: hashedPassword
        });
      }

      rowIndex++;
    }

    if (errors.length > 0 && teachersToInsert.length === 0) {
      await t.rollback();
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {}
      return res.status(400).json({
        success: false,
        message: "All rows failed validation",
        errors: errors
      });
    }

    if (teachersToInsert.length === 0) {
      await t.rollback();
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {}
      return res.status(400).json({
        success: false,
        message: "No valid teachers to import",
        errors: errors
      });
    }

    // Insert valid teachers
    const insertedTeachers = [];
    for (const teacher of teachersToInsert) {
      try {
        const [result] = await sequelize.query(
          `INSERT INTO teachers (school_id, name, email, phone, subject, status, password, created_at, updated_at) 
           VALUES (:school_id, :name, :email, :phone, :subject, :status, :password, NOW(), NOW())
           RETURNING id, school_id, name, email, phone, subject, status, created_at, updated_at`,
          {
            replacements: teacher,
            type: QueryTypes.INSERT,
            transaction: t
          }
        );
        insertedTeachers.push(result[0] || result);
      } catch (insertError) {
        console.error(`Error inserting teacher ${teacher.email}:`, insertError);
        errors.push({
          row: data.findIndex(r => getField(r, 'email') === teacher.email) + 2,
          errors: [`Failed to insert database record: ${insertError.message}`]
        });
      }
    }

    await t.commit();

    // Cleanup file
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) {
      console.error("Failed to delete temp file:", e);
    }

    return res.status(201).json({
      success: true,
      message: `Import processed. Added: ${insertedTeachers.length}, Skipped: ${errors.length}`,
      count: insertedTeachers.length,
      teachers: insertedTeachers,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    await t.rollback();
    // Cleanup file on error
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { }
    }
    console.error('Import Teachers Error:', error);
    res.status(500).json({ success: false, message: 'Server error during import', error: error.message });
  }
};

// ---------------- Get Teacher Classes ----------------
exports.getTeacherClasses = async (req, res) => {
  try {
    const { teacher_id } = req.params;
    const schoolId = req.user?.school_id;

    if (!teacher_id) {
      return res.status(400).json({ success: false, message: 'Teacher ID is required' });
    }

    // Verify teacher belongs to the school
    const teacherCheck = await sequelize.query(
      `SELECT id, school_id FROM teachers WHERE id = :teacher_id`,
      { replacements: { teacher_id }, type: QueryTypes.SELECT }
    );

    if (!teacherCheck.length || teacherCheck[0].school_id !== schoolId) {
      return res.status(404).json({ success: false, message: 'Teacher not found or unauthorized' });
    }

    const classes = await sequelize.query(
      `SELECT id, division_name, class_name, class_id 
       FROM divisions 
       WHERE teacher_id = :teacher_id`,
      { replacements: { teacher_id }, type: QueryTypes.SELECT }
    );

    res.status(200).json({ success: true, data: classes });

  } catch (error) {
    console.error('Get Teacher Classes Error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching teacher classes' });
  }
};