const { QueryTypes } = require('sequelize');
const sequelize = require('../../config/db');
const bcrypt = require('bcryptjs');

// Helper to log debug messages with timestamp
const log = (message, data = null) => {
  console.log(`[${new Date().toISOString()}] ${message}`, data || '');
};

// ---------------- Add School ----------------
const createSchool = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    log('Request to create school', req.body);

    const {
      schoolName,
      trustId,
      schoolAdminName,
      email,
      phone,
      address,
      city,
      state,
      country,
      pincode,
      totalStudents,
      password,
      section,
      classes,
      pinCode,   // Handle camelCase variation
      pin_code   // Handle snake_case variation
    } = req.body;

    const finalPincode = pincode || pinCode || pin_code || null;

    if (!schoolName || !trustId || !password) {
      await t.rollback();
      log('Missing required fields');
      return res.status(400).json({ success: false, message: 'School name, trust ID, and password are required' });
    }

    // Check email uniqueness
    if (email) {
      const existingSchool = await sequelize.query(
        `SELECT id FROM schools WHERE email = :email LIMIT 1`,
        { replacements: { email }, type: QueryTypes.SELECT, transaction: t }
      );
      if (existingSchool.length > 0) {
        await t.rollback();
        log('Email already exists', email);
        return res.status(409).json({ success: false, message: 'Email already exists.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate custom_id and school_code
    const lastSchool = await sequelize.query(
      `SELECT custom_id, school_code FROM schools WHERE (custom_id LIKE 'SCH-%' OR school_code LIKE 'SCH-%') ORDER BY id DESC LIMIT 1`,
      { type: QueryTypes.SELECT, transaction: t }
    );

    let newSchoolId = 'SCH-001';
    let generatedSchoolCode = 'SCH-001';

    if (lastSchool.length > 0) {
      let lastNumber = 0;
      if (lastSchool[0].custom_id && lastSchool[0].custom_id.startsWith('SCH-')) {
        lastNumber = parseInt(lastSchool[0].custom_id.split('-')[1]) || 0;
      } else if (lastSchool[0].school_code && lastSchool[0].school_code.startsWith('SCH-')) {
        lastNumber = parseInt(lastSchool[0].school_code.split('-')[1]) || 0;
      }
      const nextNumber = lastNumber + 1;
      newSchoolId = `SCH-${String(nextNumber).padStart(3, '0')}`;
      generatedSchoolCode = `SCH-${String(nextNumber).padStart(3, '0')}`;
    }

    log('Generated school IDs', { newSchoolId, generatedSchoolCode });

    // Insert school
    const [school] = await sequelize.query(
      `INSERT INTO schools 
       (trust_id, school_name, school_admin_name, email, phone, address, city, state, pincode, total_students, password, custom_id, school_code, section, created_at, updated_at)
       VALUES (:trust_id, :school_name, :school_admin_name, :email, :phone, :address, :city, :state, :pincode, :total_students, :password, :custom_id, :school_code, :section, NOW(), NOW())
       RETURNING id, school_name, email, school_code, section, address, city, state, pincode`,
      {
        replacements: {
          trust_id: trustId,
          school_name: schoolName,
          school_admin_name: schoolAdminName || null,
          email: email || null,
          phone: phone || null,
          address: address || null,
          city: city || null,
          state: state || null,
          pincode: finalPincode,
          total_students: totalStudents || 0,
          password: hashedPassword,
          custom_id: newSchoolId,
          school_code: generatedSchoolCode,
          section: section || null
        },
        type: QueryTypes.SELECT,
        transaction: t
      }
    );

    if (!school || !school.id) {
      await t.rollback();
      log('Failed to insert school', school);
      return res.status(500).json({ success: false, message: 'Failed to create school' });
    }

    const schoolId = school.id;

    log('School inserted', school);

    // Insert classes and divisions
    if (classes && Array.isArray(classes) && classes.length > 0) {
      log('Processing classes', classes);

      const classesMap = new Map();
      for (const item of classes) {
        const { class_name, section: classSection, divisions } = item;
        if (!class_name) continue;

        if (!classesMap.has(class_name)) {
          classesMap.set(class_name, { class_name, section: classSection || section || 'Custom', divisions: [] });
        }

        if (divisions && Array.isArray(divisions)) {
          for (const div of divisions) {
            const divName = typeof div === 'string' ? div : div.division_name;
            const divTeacher = typeof div === 'object' ? div.class_teacher : null;
            const divTeacherId = typeof div === 'object' ? div.teacher_id : null;
            const divExpected = typeof div === 'object' ? div.expected_students : null;

            if (divName && !classesMap.get(class_name).divisions.find(d => d.division_name === divName)) {
              classesMap.get(class_name).divisions.push({
                division_name: divName,
                class_teacher: divTeacher || null,
                teacher_id: divTeacherId || null,
                expected_students: divExpected || 0
              });
            }
          }
        }
      }

      for (const classData of classesMap.values()) {
        const { class_name, section: classSection, divisions } = classData;

        const classInsertResult = await sequelize.query(
          `INSERT INTO classes (school_id, class_name, section, created_at, updated_at)
           VALUES (:school_id, :class_name, :section, NOW(), NOW())
           RETURNING id`,
          {
            replacements: { school_id: schoolId, class_name, section: classSection || section || 'Custom' },
            type: QueryTypes.SELECT,
            transaction: t
          }
        );

        const classReturnedRows = classInsertResult[1] || classInsertResult[0];
        const classRow = Array.isArray(classReturnedRows) && classReturnedRows.length > 0 ? classReturnedRows[0] : classReturnedRows || null;
        const classId = classRow?.id;

        if (!classId) {
          log('Failed to insert class', classData);
          continue;
        }

        if (divisions && divisions.length > 0) {
          for (const div of divisions) {
            await sequelize.query(
              `INSERT INTO divisions (class_id, class_name, division_name, class_teacher, teacher_id, expected_students, created_at, updated_at)
               VALUES (:class_id, :class_name, :division_name, :class_teacher, :teacher_id, :expected_students, NOW(), NOW())`,
              {
                replacements: {
                  class_id: classId,
                  class_name,
                  division_name: div.division_name,
                  class_teacher: div.class_teacher || null,
                  teacher_id: div.teacher_id || null,
                  expected_students: div.expected_students || 0
                },
                transaction: t
              }
            );
          }
        }
      }
    }

    await t.commit();
    log('Transaction committed for school creation', { schoolId });

    // Fetch full school data
    const [completeSchool] = await sequelize.query(
      `SELECT id, custom_id, school_name, school_code, section, email, phone, address, trust_id, created_at
       FROM schools WHERE id = :id`,
      { replacements: { id: schoolId }, type: QueryTypes.SELECT }
    );

    res.status(201).json({ success: true, message: 'School added successfully', data: completeSchool });
  } catch (err) {
    await t.rollback();
    log('Create School Error', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ---------------- Update School ----------------
const updateSchool = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      schoolName,
      trustId,
      schoolAdminName,
      email,
      phone,
      address,
      city,
      state,
      country,
      pincode,
      totalStudents,
      password,
      classes,
      pinCode,
      pin_code
    } = req.body;

    const finalPincode = pincode || pinCode || pin_code;

    // Check if school exists
    const existing = await sequelize.query(
      `SELECT * FROM schools WHERE id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT, transaction: t }
    );

    if (!existing.length) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Build update fields dynamically
    const updateFields = [];
    const replacements = { id };

    if (schoolName) {
      updateFields.push('school_name = :school_name');
      replacements.school_name = schoolName.trim();
    }
    if (trustId) {
      updateFields.push('trust_id = :trust_id');
      replacements.trust_id = trustId;
    }
    if (schoolAdminName) {
      updateFields.push('school_admin_name = :school_admin_name');
      replacements.school_admin_name = schoolAdminName.trim();
    }
    if (email) {
      updateFields.push('email = :email');
      replacements.email = email.trim();
    }
    if (phone) {
      updateFields.push('phone = :phone');
      replacements.phone = phone.trim();
    }
    if (address || city || state || finalPincode) {
      updateFields.push('address = :address');
      const addressParts = [address, city, state, country, finalPincode].filter(Boolean);
      replacements.address = addressParts.length ? addressParts.join(', ') : null;
    }
    if (city) {
      updateFields.push('city = :city');
      replacements.city = city.trim();
    }
    if (state) {
      updateFields.push('state = :state');
      replacements.state = state.trim();
    }
    if (finalPincode) {
      updateFields.push('pincode = :pincode');
      replacements.pincode = finalPincode.toString().trim();
    }
    if (totalStudents !== undefined) {
      updateFields.push('total_students = :total_students');
      replacements.total_students = totalStudents;
    }
    if (hashedPassword) {
      updateFields.push('password = :password');
      replacements.password = hashedPassword;
    }

    updateFields.push('updated_at = NOW()');

    if (updateFields.length > 0) {
      const updateQuery = `
        UPDATE schools
        SET ${updateFields.join(', ')}
        WHERE id = :id
        RETURNING *;
      `;

      const [updatedResult] = await sequelize.query(updateQuery, {
        replacements,
        type: QueryTypes.UPDATE,
        transaction: t
      });

      const updatedSchool = Array.isArray(updatedResult) ? updatedResult[0] : updatedResult;
      delete updatedSchool.password;
    }

    // Handle classes and divisions if provided
    // Frontend sends flat array: [{ class_name, section, division }]
    // Need to group by class_name and create divisions array
    if (classes && Array.isArray(classes) && classes.length > 0) {
      // Group classes by class_name
      const classesMap = new Map();
      for (const item of classes) {
        const { class_name, section, division } = item;
        if (!class_name) continue;

        if (!classesMap.has(class_name)) {
          classesMap.set(class_name, {
            class_name,
            section: section || 'Custom',
            divisions: []
          });
        }

        if (division) {
          const divisionObj = typeof division === 'string' ? { division_name: division } : division;
          const divSearch = classesMap.get(class_name).divisions.find(d => d.division_name === divisionObj.division_name);

          if (divisionObj.division_name && !divSearch) {
            classesMap.get(class_name).divisions.push({
              division_name: divisionObj.division_name,
              class_teacher: divisionObj.class_teacher || null,
              teacher_id: divisionObj.teacher_id || null,
              expected_students: divisionObj.expected_students || 0
            });
          }
        }
      }

      const groupedClasses = Array.from(classesMap.values());

      // Get existing classes for this school
      const existingClasses = await sequelize.query(
        `SELECT id, class_name FROM classes WHERE school_id = :id`,
        { replacements: { id }, type: QueryTypes.SELECT, transaction: t }
      );

      const existingClassMap = new Map();
      existingClasses.forEach(cls => {
        existingClassMap.set(cls.class_name.toLowerCase(), cls.id);
      });

      // Process each class
      for (const classData of groupedClasses) {
        const { class_name, section, divisions } = classData;

        if (!class_name) continue;

        let classId;
        const classNameLower = class_name.toLowerCase();

        if (existingClassMap.has(classNameLower)) {
          // Update existing class
          classId = existingClassMap.get(classNameLower);
          if (section) {
            await sequelize.query(
              `UPDATE classes SET section = :section, updated_at = NOW() WHERE id = :class_id`,
              { replacements: { section, class_id: classId }, transaction: t }
            );
          }
        } else {
          // Create new class
          const [newClass] = await sequelize.query(
            `INSERT INTO classes (school_id, class_name, section, created_at, updated_at)
             VALUES (:school_id, :class_name, :section, NOW(), NOW())
             RETURNING id`,
            {
              replacements: { school_id: id, class_name, section: section || 'Custom' },
              type: QueryTypes.INSERT,
              transaction: t
            }
          );
          classId = Array.isArray(newClass) ? newClass[0]?.id : newClass?.id;
        }

        // Handle divisions for this class
        if (divisions && Array.isArray(divisions) && divisions.length > 0) {
          // Get existing divisions
          const existingDivisions = await sequelize.query(
            `SELECT id, division_name FROM divisions WHERE class_id = :class_id`,
            { replacements: { class_id: classId }, type: QueryTypes.SELECT, transaction: t }
          );

          const existingDivisionMap = new Map();
          existingDivisions.forEach(div => {
            existingDivisionMap.set(div.division_name.toLowerCase(), div.id);
          });

          // Process divisions
          for (const divObj of divisions) {
            if (!divObj.division_name) continue;

            const divisionNameLower = divObj.division_name.toLowerCase();

            if (!existingDivisionMap.has(divisionNameLower)) {
              // Create new division
              await sequelize.query(
                `INSERT INTO divisions (class_id, class_name, division_name, class_teacher, teacher_id, expected_students, created_at, updated_at)
                 VALUES (:class_id, :class_name, :division_name, :class_teacher, :teacher_id, :expected_students, NOW(), NOW())`,
                {
                  replacements: {
                    class_id: classId,
                    class_name: class_name,
                    division_name: divObj.division_name,
                    class_teacher: divObj.class_teacher || null,
                    teacher_id: divObj.teacher_id || null,
                    expected_students: divObj.expected_students || 0
                  },
                  transaction: t
                }
              );
            } else {
              // Update existing division (if needed in bulk update)
              const divId = existingDivisionMap.get(divisionNameLower);
              await sequelize.query(
                `UPDATE divisions SET 
                  class_teacher = COALESCE(:class_teacher, class_teacher),
                  teacher_id = COALESCE(:teacher_id, teacher_id),
                  expected_students = COALESCE(:expected_students, expected_students),
                  updated_at = NOW()
                 WHERE id = :division_id`,
                {
                  replacements: {
                    division_id: divId,
                    class_teacher: divObj.class_teacher || null,
                    teacher_id: divObj.teacher_id || null,
                    expected_students: divObj.expected_students || 0
                  },
                  transaction: t
                }
              );
            }
          }

          // Delete divisions that are no longer in the list
          const currentDivisionNamesLower = divisions.map(d => d.division_name.toLowerCase());
          for (const [divName, divId] of existingDivisionMap.entries()) {
            if (!currentDivisionNamesLower.includes(divName)) {
              await sequelize.query(
                `DELETE FROM divisions WHERE id = :division_id`,
                { replacements: { division_id: divId }, transaction: t }
              );
            }
          }
        }
      }

      // Delete classes that are no longer in the list
      const currentClassNamesLower = groupedClasses.map(c => c.class_name.toLowerCase());
      for (const [className, classId] of existingClassMap.entries()) {
        if (!currentClassNamesLower.includes(className)) {
          // Delete divisions first (cascade)
          await sequelize.query(
            `DELETE FROM divisions WHERE class_id = :class_id`,
            { replacements: { class_id: classId }, transaction: t }
          );
          // Delete class
          await sequelize.query(
            `DELETE FROM classes WHERE id = :class_id`,
            { replacements: { class_id: classId }, transaction: t }
          );
        }
      }
    }

    await t.commit();

    // Fetch updated school data
    const updatedSchoolQuery = `
      SELECT s.id, s.custom_id, s.school_name, s.school_admin_name, s.email, s.phone, 
             s.address, s.total_students, s.trust_id, s.created_at, s.updated_at,
             t.trust_name
      FROM schools s
      JOIN trusts t ON s.trust_id = t.id
      WHERE s.id = :id;
    `;

    const [updatedSchool] = await sequelize.query(updatedSchoolQuery, {
      replacements: { id },
      type: QueryTypes.SELECT
    });

    res.status(200).json({
      success: true,
      message: 'School updated successfully',
      data: updatedSchool
    });

  } catch (err) {
    await t.rollback();
    console.error('Update School Error:', err);
    res.status(500).json({ success: false, message: 'Server error while updating school' });
  }
};

// ---------------- Get All Schools ----------------
const getAllSchools = async (req, res) => {
  try {
    const schools = await sequelize.query(
      `SELECT s.id, s.custom_id, s.trust_id, s.school_name, s.school_admin_name, s.email, s.phone, s.address, s.city, s.state, s.pincode, s.total_students, s.created_at, s.updated_at, t.trust_name
       FROM schools s
       JOIN trusts t ON s.trust_id = t.id
       ORDER BY s.id DESC;`,
      { type: QueryTypes.SELECT }
    );

    // Map results to include country as default (columns don't exist in DB)
    const schoolsWithDefaults = schools.map(school => ({
      ...school,
      country: 'India'
    }));

    res.status(200).json({ success: true, data: schoolsWithDefaults });

  } catch (err) {
    console.error('Get All Schools Error:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
};

// ---------------- Get School By ID ----------------
const getSchoolById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get school with trust info
    const schoolQuery = `
      SELECT 
        s.id, s.custom_id, s.school_name, s.school_admin_name, s.email, s.phone, 
        s.address, s.city, s.state, s.pincode, s.total_students, s.trust_id, s.created_at, s.updated_at,
        t.trust_name, t.id as trust_id
      FROM schools s
      JOIN trusts t ON s.trust_id = t.id
      WHERE s.id = :id;
    `;

    const schools = await sequelize.query(schoolQuery, {
      replacements: { id },
      type: QueryTypes.SELECT
    });

    if (!schools.length) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    const school = schools[0];

    // Get classes and divisions for this school
    const classesQuery = `
      SELECT 
        c.id as class_id, c.class_name, c.section,
        d.id as division_id, d.division_name, d.class_teacher, d.expected_students
      FROM classes c
      LEFT JOIN divisions d ON c.id = d.class_id
      WHERE c.school_id = :id
      ORDER BY c.id, d.id;
    `;

    const classesData = await sequelize.query(classesQuery, {
      replacements: { id },
      type: QueryTypes.SELECT
    });

    // Organize classes and divisions
    const classesMap = new Map();
    classesData.forEach(row => {
      if (!classesMap.has(row.class_name)) {
        classesMap.set(row.class_name, {
          class_name: row.class_name,
          section: row.section,
          divisions: []
        });
      }
      if (row.division_name) {
        classesMap.get(row.class_name).divisions.push({
          division_name: row.division_name,
          class_teacher: row.class_teacher,
          expected_students: row.expected_students
        });
      }
    });

    const classes = Array.from(classesMap.values());

    res.status(200).json({
      success: true,
      data: {
        ...school,
        classes
      }
    });

  } catch (err) {
    console.error('Get School By ID Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =======================
// PLATFORM ADMIN: GET SCHOOL CREDENTIALS
// =======================
const getSchoolCredentials = async (req, res) => {
  try {
    const { id } = req.params;

    const school = await sequelize.query(
      `SELECT id, school_name, email, school_code, section, created_at 
       FROM schools 
       WHERE id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!school.length) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    res.json({
      success: true,
      data: {
        school_id: school[0].id,
        school_name: school[0].school_name,
        email: school[0].email,
        school_code: school[0].school_code,
        section: school[0].section,
        login_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
        note: 'Password was set during school creation. Use reset password if needed.'
      }
    });
  } catch (error) {
    console.error('Error fetching credentials:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =======================
// PLATFORM ADMIN: RESET SCHOOL PASSWORD
// =======================
const resetSchoolPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword, sendEmail } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const school = await sequelize.query(
      `SELECT id, school_name, email FROM schools WHERE id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!school.length) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await sequelize.query(
      `UPDATE schools SET password = :password, updated_at = NOW() WHERE id = :id`,
      { replacements: { password: hashedPassword, id }, type: QueryTypes.UPDATE }
    );

    if (sendEmail) {
      console.log(`Password reset email should be sent to ${school[0].email}`);
    }

    res.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        email: school[0].email,
        newPassword: sendEmail ? null : newPassword
      }
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =======================
// PLATFORM ADMIN: SEND CREDENTIALS VIA EMAIL
// =======================
const sendSchoolCredentials = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password } = req.body;

    const school = await sequelize.query(
      `SELECT id, school_name, email, school_code, section 
       FROM schools 
       WHERE id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!school.length) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    const recipientEmail = email || school[0].email;
    const loginPassword = password;

    console.log('Email should be sent:', {
      to: recipientEmail,
      subject: `School Login Credentials - ${school[0].school_name}`,
      school_name: school[0].school_name,
      school_code: school[0].school_code,
      email: school[0].email,
      password: loginPassword
    });

    res.json({
      success: true,
      message: 'Credentials sent successfully',
      data: {
        email_sent_to: recipientEmail
      }
    });
  } catch (error) {
    console.error('Error sending credentials:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =======================
// PLATFORM ADMIN: CREATE CLASS FOR SCHOOL
// =======================
const createClassForSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const { class_name } = req.body;

    if (!class_name) {
      return res.status(400).json({ success: false, message: 'Class name is required' });
    }

    // Get school section
    const school = await sequelize.query(
      `SELECT id, section FROM schools WHERE id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!school.length) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    // Check if class already exists
    const existingClass = await sequelize.query(
      `SELECT id FROM classes WHERE school_id = :id AND LOWER(class_name) = LOWER(:class_name)`,
      { replacements: { id, class_name: class_name.trim() }, type: QueryTypes.SELECT }
    );

    if (existingClass.length > 0) {
      return res.status(409).json({ success: false, message: 'Class already exists' });
    }

    const section = school[0].section || null;

    // Create class
    const [newClass] = await sequelize.query(
      `INSERT INTO classes (school_id, class_name, section, created_at, updated_at)
       VALUES (:id, :class_name, :section, NOW(), NOW())
       RETURNING *`,
      { replacements: { id, class_name: class_name.trim(), section }, type: QueryTypes.SELECT }
    );

    res.status(201).json({ success: true, message: 'Class created successfully', data: newClass });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =======================
// PLATFORM ADMIN: CREATE DIVISION FOR CLASS
// =======================
const createDivisionForClass = async (req, res) => {
  try {
    const { id, class_id } = req.params;
    const { division_name, class_teacher, teacher_id, expected_students } = req.body;

    if (!division_name) {
      return res.status(400).json({ success: false, message: 'Division name is required' });
    }

    // Verify school exists
    const school = await sequelize.query(
      `SELECT id FROM schools WHERE id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!school.length) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    // Get class info
    const classData = await sequelize.query(
      `SELECT id, class_name FROM classes WHERE id = :class_id AND school_id = :id`,
      { replacements: { class_id, id }, type: QueryTypes.SELECT }
    );

    if (!classData.length) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    // --- ONE TEACHER ONE CLASS CHECK ---
    if (teacher_id || class_teacher) {
      const checkQuery = `
        SELECT d.division_name, d.class_name 
        FROM divisions d
        INNER JOIN classes c ON d.class_id = c.id
        WHERE c.school_id = :id 
        AND (d.teacher_id = :teacher_id OR (d.class_teacher = :class_teacher AND d.teacher_id IS NULL))
        LIMIT 1
      `;
      const existingAssignment = await sequelize.query(checkQuery, {
        replacements: { id, teacher_id: teacher_id || null, class_teacher: class_teacher || null },
        type: QueryTypes.SELECT
      });

      if (existingAssignment.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Teacher is already assigned to Class ${existingAssignment[0].class_name} - ${existingAssignment[0].division_name}. One teacher can only be assigned to one class.`
        });
      }

      // Sync name if only ID provided
      if (teacher_id && !class_teacher) {
        const teacherData = await sequelize.query(
          `SELECT name FROM teachers WHERE id = :teacher_id AND school_id = :id`,
          { replacements: { teacher_id, id }, type: QueryTypes.SELECT }
        );
        if (teacherData.length > 0) {
          req.body.class_teacher = teacherData[0].name;
        }
      }
    }

    // Create division
    const [newDivision] = await sequelize.query(
      `INSERT INTO divisions (class_id, class_name, division_name, class_teacher, teacher_id, expected_students, created_at, updated_at)
       VALUES (:class_id, :class_name, :division_name, :class_teacher, :teacher_id, :expected_students, NOW(), NOW())
       RETURNING *`,
      {
        replacements: {
          class_id,
          class_name: classData[0].class_name,
          division_name: division_name.trim(),
          class_teacher: req.body.class_teacher?.trim() || class_teacher?.trim() || null,
          teacher_id: teacher_id || null,
          expected_students: expected_students || 0
        },
        type: QueryTypes.SELECT
      }
    );

    res.status(201).json({ success: true, message: 'Division created successfully', data: newDivision });
  } catch (error) {
    console.error('Error creating division:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =======================
// PLATFORM ADMIN: GET ALL CLASSES FOR SCHOOL
// =======================
const getClassesForSchool = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify school exists
    const school = await sequelize.query(
      `SELECT id FROM schools WHERE id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!school.length) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    // Get classes with divisions
    const classes = await sequelize.query(
      `SELECT c.id, c.class_name, c.section, c.created_at,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', d.id,
                    'division_name', d.division_name,
                    'class_teacher', d.class_teacher,
                    'expected_students', d.expected_students
                  )
                ) FILTER (WHERE d.id IS NOT NULL),
                '[]'::json
              ) as divisions
       FROM classes c
       LEFT JOIN divisions d ON c.id = d.class_id
       WHERE c.school_id = :id
       GROUP BY c.id, c.class_name, c.section, c.created_at
       ORDER BY c.class_name`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    res.json({ success: true, data: classes });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =======================
// PLATFORM ADMIN: UPDATE CLASS
// =======================
const updateClassForSchool = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id, class_id } = req.params;
    const { class_name } = req.body;

    if (!class_name) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Class name is required' });
    }

    // Check if class exists
    const existingClass = await sequelize.query(
      `SELECT id FROM classes WHERE id = :class_id AND school_id = :id`,
      { replacements: { class_id, id }, type: QueryTypes.SELECT, transaction: t }
    );

    if (!existingClass.length) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    // Update class name in classes table
    await sequelize.query(
      `UPDATE classes SET class_name = :class_name, updated_at = NOW() WHERE id = :class_id`,
      { replacements: { class_name: class_name.trim(), class_id }, type: QueryTypes.UPDATE, transaction: t }
    );

    // Update class name in divisions table (since it stores class_name for some reason)
    await sequelize.query(
      `UPDATE divisions SET class_name = :class_name, updated_at = NOW() WHERE class_id = :class_id`,
      { replacements: { class_name: class_name.trim(), class_id }, type: QueryTypes.UPDATE, transaction: t }
    );

    await t.commit();
    res.json({ success: true, message: 'Class updated successfully' });
  } catch (error) {
    await t.rollback();
    console.error('Error updating class:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =======================
// PLATFORM ADMIN: DELETE CLASS
// =======================
const deleteClassForSchool = async (req, res) => {
  try {
    const { id, class_id } = req.params;

    // Check if class exists
    const existingClass = await sequelize.query(
      `SELECT id FROM classes WHERE id = :class_id AND school_id = :id`,
      { replacements: { class_id, id }, type: QueryTypes.SELECT }
    );

    if (!existingClass.length) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    // Check for associated divisions
    const divisions = await sequelize.query(
      `SELECT id FROM divisions WHERE class_id = :class_id`,
      { replacements: { class_id }, type: QueryTypes.SELECT }
    );

    if (divisions.length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete class with existing divisions' });
    }

    // Delete class
    await sequelize.query(
      `DELETE FROM classes WHERE id = :class_id`,
      { replacements: { class_id }, type: QueryTypes.DELETE }
    );

    res.json({ success: true, message: 'Class deleted successfully' });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete class due to existing data dependencies (divisions or students).'
      });
    }
    console.error('Error deleting class:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =======================
// PLATFORM ADMIN: UPDATE DIVISION
// =======================
const updateDivisionForClass = async (req, res) => {
  try {
    const { id, class_id, division_id } = req.params;
    const { division_name, class_teacher, teacher_id, expected_students } = req.body;

    // Verify division belongs to class and school
    const division = await sequelize.query(
      `SELECT d.id FROM divisions d
       JOIN classes c ON d.class_id = c.id
       WHERE d.id = :division_id AND c.id = :class_id AND c.school_id = :id`,
      { replacements: { division_id, class_id, id }, type: QueryTypes.SELECT }
    );

    if (!division.length) {
      return res.status(404).json({ success: false, message: 'Division not found' });
    }

    const updateFields = [];
    const replacements = { division_id };

    if (division_name) {
      updateFields.push('division_name = :division_name');
      replacements.division_name = division_name.trim();
    }

    if (class_teacher !== undefined || teacher_id !== undefined) {
      const finalTeacherId = teacher_id !== undefined ? teacher_id : null;
      let finalTeacherName = class_teacher?.trim() || null;

      // ONE TEACHER ONE CLASS CHECK (if teacher specified)
      if (finalTeacherId || finalTeacherName) {
        const checkQuery = `
          SELECT d.division_name, d.class_name 
          FROM divisions d
          INNER JOIN classes c ON d.class_id = c.id
          WHERE c.school_id = :id 
          AND d.id != :division_id
          AND (d.teacher_id = :teacher_id OR (d.class_teacher = :class_teacher AND d.teacher_id IS NULL))
          LIMIT 1
        `;
        const existingAssignment = await sequelize.query(checkQuery, {
          replacements: { id, division_id, teacher_id: finalTeacherId || null, class_teacher: finalTeacherName || null },
          type: QueryTypes.SELECT
        });

        if (existingAssignment.length > 0) {
          return res.status(409).json({
            success: false,
            message: `Teacher is already assigned to Class ${existingAssignment[0].class_name} - ${existingAssignment[0].division_name}.`
          });
        }

        // Sync name from ID
        if (finalTeacherId && !finalTeacherName) {
          const teacherData = await sequelize.query(
            `SELECT name FROM teachers WHERE id = :teacher_id AND school_id = :id`,
            { replacements: { teacher_id: finalTeacherId, id }, type: QueryTypes.SELECT }
          );
          if (teacherData.length > 0) finalTeacherName = teacherData[0].name;
        }
      }

      updateFields.push('class_teacher = :class_teacher');
      replacements.class_teacher = finalTeacherName;
      updateFields.push('teacher_id = :teacher_id');
      replacements.teacher_id = finalTeacherId;
    }

    if (expected_students !== undefined) {
      updateFields.push('expected_students = :expected_students');
      replacements.expected_students = expected_students || 0;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    await sequelize.query(
      `UPDATE divisions SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = :division_id`,
      { replacements, type: QueryTypes.UPDATE }
    );

    res.json({ success: true, message: 'Division updated successfully' });
  } catch (error) {
    console.error('Error updating division:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =======================
// PLATFORM ADMIN: DELETE DIVISION
// =======================
const deleteDivisionForClass = async (req, res) => {
  try {
    const { id, class_id, division_id } = req.params;

    // Verify division
    const division = await sequelize.query(
      `SELECT d.id FROM divisions d
       JOIN classes c ON d.class_id = c.id
       WHERE d.id = :division_id AND c.id = :class_id AND c.school_id = :id`,
      { replacements: { division_id, class_id, id }, type: QueryTypes.SELECT }
    );

    if (!division.length) {
      return res.status(404).json({ success: false, message: 'Division not found' });
    }

    // NEW: Check if students are linked to this division in student_forms
    const students = await sequelize.query(
      `SELECT id FROM student_forms WHERE division_id = :division_id LIMIT 1`,
      { replacements: { division_id }, type: QueryTypes.SELECT }
    );

    if (students.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete division because it has registered students. Please delete or move the students first.'
      });
    }

    // Delete division
    await sequelize.query(
      `DELETE FROM divisions WHERE id = :division_id`,
      { replacements: { division_id }, type: QueryTypes.DELETE }
    );

    res.json({ success: true, message: 'Division deleted successfully' });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete division due to existing data dependencies (students or forms).'
      });
    }
    console.error('Error deleting division:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =======================
// PLATFORM ADMIN: GET TEACHERS FOR SCHOOL
// =======================
const getTeachersForSchool = async (req, res) => {
  try {
    const { id } = req.params;

    const teachers = await sequelize.query(
      `SELECT id, school_id, name, email, phone, subject, status, created_at, updated_at 
       FROM teachers WHERE school_id = :id ORDER BY id DESC`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    res.status(200).json({ success: true, data: teachers });
  } catch (error) {
    console.error('Get Teachers Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =======================
// PLATFORM ADMIN: CREATE TEACHER FOR SCHOOL
// =======================
const createTeacherForSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, password, subject, status } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    // Verify school exists
    const school = await sequelize.query(
      `SELECT id FROM schools WHERE id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!school.length) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    // Email must be unique within the same school (multi-school teachers allowed)
    const existingTeacher = await sequelize.query(
      `SELECT id FROM teachers WHERE LOWER(email) = LOWER(:email) AND school_id = :school_id LIMIT 1`,
      { replacements: { email: email.trim(), school_id: id }, type: QueryTypes.SELECT }
    );

    if (existingTeacher.length > 0) {
      return res.status(409).json({ success: false, message: 'Teacher with this email already exists in this school' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newTeacher] = await sequelize.query(
      `INSERT INTO teachers (school_id, name, email, phone, password, subject, status, created_at, updated_at)
       VALUES (:school_id, :name, :email, :phone, :password, :subject, :status, NOW(), NOW())
       RETURNING id, name, email, phone, subject, status, created_at, updated_at`,
      {
        replacements: {
          school_id: id,
          name: name.trim(),
          email: email.trim(),
          phone: phone?.trim() || null,
          password: hashedPassword,
          subject: subject?.trim() || null,
          status: status || 'Active'
        },
        type: QueryTypes.SELECT
      }
    );

    res.status(201).json({ success: true, message: 'Teacher created successfully', data: newTeacher });
  } catch (error) {
    console.error('Error creating teacher:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =======================
// PLATFORM ADMIN: UPDATE TEACHER
// =======================
const updateTeacherForSchool = async (req, res) => {
  try {
    const { id, teacher_id } = req.params;
    const updates = req.body;

    // Verify school exists
    const school = await sequelize.query(
      `SELECT id FROM schools WHERE id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!school.length) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    // Verify teacher belongs to school
    const teacher = await sequelize.query(
      `SELECT id FROM teachers WHERE id = :teacher_id AND school_id = :id`,
      { replacements: { teacher_id, id }, type: QueryTypes.SELECT }
    );

    if (!teacher.length) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    // Build update query
    const updateFields = [];
    const replacements = { teacher_id };

    if (updates.name) {
      updateFields.push('name = :name');
      replacements.name = updates.name;
    }
    if (updates.email) {
      updateFields.push('email = :email');
      replacements.email = updates.email;
    }
    if (updates.phone) {
      updateFields.push('phone = :phone');
      replacements.phone = updates.phone;
    }
    if (updates.subject) {
      updateFields.push('subject = :subject');
      replacements.subject = updates.subject;
    }
    if (updates.status) {
      updateFields.push('status = :status');
      replacements.status = updates.status;
    }
    if (updates.password) {
      const hashedPassword = await bcrypt.hash(updates.password, 10);
      updateFields.push('password = :password');
      replacements.password = hashedPassword;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    updateFields.push('updated_at = NOW()');

    const updateQuery = `
      UPDATE teachers 
      SET ${updateFields.join(', ')}
      WHERE id = :teacher_id
      RETURNING id, name, email, phone, subject, status, created_at, updated_at
    `;

    const [updatedTeacher] = await sequelize.query(updateQuery, {
      replacements,
      type: QueryTypes.SELECT
    });

    res.json({ success: true, message: 'Teacher updated successfully', data: updatedTeacher });
  } catch (error) {
    console.error('Error updating teacher:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =======================
// PLATFORM ADMIN: DELETE TEACHER
// =======================
const deleteTeacherForSchool = async (req, res) => {
  try {
    const { id, teacher_id } = req.params;

    // Verify school exists
    const school = await sequelize.query(
      `SELECT id FROM schools WHERE id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!school.length) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    // Verify teacher belongs to school
    const teacher = await sequelize.query(
      `SELECT id FROM teachers WHERE id = :teacher_id AND school_id = :id`,
      { replacements: { teacher_id, id }, type: QueryTypes.SELECT }
    );

    if (!teacher.length) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    // Delete teacher
    await sequelize.query(
      `DELETE FROM teachers WHERE id = :teacher_id`,
      { replacements: { teacher_id }, type: QueryTypes.DELETE }
    );

    res.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =======================
// PLATFORM ADMIN: DELETE SCHOOL
// =======================
const deleteSchool = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify school exists
    const school = await sequelize.query(
      `SELECT id, school_name FROM schools WHERE id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!school.length) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    // Delete school
    await sequelize.query(
      `DELETE FROM schools WHERE id = :id`,
      { replacements: { id }, type: QueryTypes.DELETE }
    );

    log(`School deleted: ${school[0].school_name} (ID: ${id})`);
    res.json({ success: true, message: 'School deleted successfully' });
  } catch (error) {
    console.error('Error deleting school:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createSchool,
  updateSchool,
  getAllSchools,
  getSchoolById,
  getSchoolCredentials,
  resetSchoolPassword,
  sendSchoolCredentials,
  createClassForSchool,
  createDivisionForClass,
  getClassesForSchool,
  getTeachersForSchool,
  createTeacherForSchool,
  updateTeacherForSchool,
  deleteTeacherForSchool,
  deleteSchool,
  updateClassForSchool,
  deleteClassForSchool,
  updateDivisionForClass,
  deleteDivisionForClass
};
