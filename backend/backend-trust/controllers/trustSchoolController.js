const { QueryTypes } = require('sequelize');
const sequelize = require('../../config/db');
const bcrypt = require('bcryptjs');

const INTEGER_MAX = 2147483647;
const isDbTeacherId = (id) => Number.isInteger(id) && id > 0 && id <= INTEGER_MAX;

function teacherAssignmentKey(teacherId, classTeacher) {
  if (teacherId) return `id:${teacherId}`;
  if (classTeacher) return `name:${String(classTeacher).trim().toLowerCase()}`;
  return null;
}

async function findTeacherAssignmentConflict({
  schoolId,
  teacherId,
  classTeacher,
  excludeDivisionId = null,
  transaction = null,
}) {
  if (!teacherId && !classTeacher) return null;

  const queryOpts = transaction ? { transaction } : {};
  const replacements = {
    school_id: schoolId,
    teacher_id: teacherId || null,
    class_teacher: classTeacher || null,
  };

  let excludeClause = '';
  if (excludeDivisionId) {
    excludeClause = 'AND d.id != :exclude_division_id';
    replacements.exclude_division_id = excludeDivisionId;
  }

  const rows = await sequelize.query(
    `SELECT d.id, d.division_name, d.class_name
     FROM divisions d
     INNER JOIN classes c ON d.class_id = c.id
     WHERE c.school_id = :school_id
       AND (d.teacher_id = :teacher_id OR (d.class_teacher = :class_teacher AND d.teacher_id IS NULL))
       ${excludeClause}
     LIMIT 1`,
    { replacements, type: QueryTypes.SELECT, ...queryOpts }
  );

  return rows[0] || null;
}

async function assertTeacherAvailableForDivision({
  schoolId,
  teacherId,
  classTeacher,
  excludeDivisionId = null,
  assignedInBatch,
  transaction,
}) {
  let resolvedTeacherId = teacherId || null;
  let resolvedTeacherName = classTeacher?.trim() || null;

  if (resolvedTeacherId && !resolvedTeacherName) {
    const teacherData = await sequelize.query(
      `SELECT name FROM teachers WHERE id = :teacher_id AND school_id = :school_id LIMIT 1`,
      {
        replacements: { teacher_id: resolvedTeacherId, school_id: schoolId },
        type: QueryTypes.SELECT,
        ...(transaction ? { transaction } : {}),
      }
    );
    if (teacherData.length > 0) {
      resolvedTeacherName = teacherData[0].name;
    }
  }

  const assignmentKey = teacherAssignmentKey(resolvedTeacherId, resolvedTeacherName);
  if (!assignmentKey) return { teacherId: null, classTeacher: null };

  if (assignedInBatch?.has(assignmentKey)) {
    const err = new Error('Teacher is already assigned to another class in this school.');
    err.statusCode = 409;
    throw err;
  }

  const conflict = await findTeacherAssignmentConflict({
    schoolId,
    teacherId: resolvedTeacherId,
    classTeacher: resolvedTeacherName,
    excludeDivisionId,
    transaction,
  });

  if (conflict) {
    const err = new Error(
      `Teacher is already assigned to Class ${conflict.class_name} - ${conflict.division_name}. One teacher can only be assigned to one class.`
    );
    err.statusCode = 409;
    throw err;
  }

  assignedInBatch?.add(assignmentKey);
  return {
    teacherId: resolvedTeacherId,
    classTeacher: resolvedTeacherName,
  };
}

async function resolveTeacherForDivision(schoolId, div, teacherCacheByEmail, transaction) {
  const teacherName = div.class_teacher?.trim() || null;
  const teacherEmail = div.teacher_email?.trim() || null;
  const normalizedEmail = teacherEmail ? teacherEmail.toLowerCase() : null;

  if (!isDbTeacherId(div.teacher_id) && !teacherEmail && !teacherName) {
    return null;
  }

  if (isDbTeacherId(div.teacher_id)) {
    const existingById = await sequelize.query(
      `SELECT id FROM teachers WHERE id = :id AND school_id = :school_id LIMIT 1`,
      { replacements: { id: div.teacher_id, school_id: schoolId }, type: QueryTypes.SELECT, transaction }
    );
    if (existingById.length > 0) {
      await sequelize.query(
        `UPDATE teachers
         SET phone = COALESCE(:phone, phone),
             subject = COALESCE(:subject, subject),
             updated_at = NOW()
         WHERE id = :id`,
        {
          replacements: {
            id: existingById[0].id,
            phone: div.teacher_phone?.trim() || null,
            subject: div.teacher_subject?.trim() || null
          },
          transaction
        }
      );
      return existingById[0].id;
    }
  }

  if (normalizedEmail && teacherCacheByEmail.has(normalizedEmail)) {
    return teacherCacheByEmail.get(normalizedEmail);
  }

  if (normalizedEmail) {
    const existingByEmail = await sequelize.query(
      `SELECT id FROM teachers WHERE LOWER(email) = :email AND school_id = :school_id LIMIT 1`,
      { replacements: { email: normalizedEmail, school_id: schoolId }, type: QueryTypes.SELECT, transaction }
    );
    if (existingByEmail.length > 0) {
      const teacherId = existingByEmail[0].id;
      await sequelize.query(
        `UPDATE teachers
         SET name = COALESCE(:name, name),
             phone = COALESCE(:phone, phone),
             subject = COALESCE(:subject, subject),
             updated_at = NOW()
         WHERE id = :id`,
        {
          replacements: {
            id: teacherId,
            name: teacherName,
            phone: div.teacher_phone?.trim() || null,
            subject: div.teacher_subject?.trim() || null
          },
          transaction
        }
      );
      teacherCacheByEmail.set(normalizedEmail, teacherId);
      return teacherId;
    }
  }

  if (!teacherEmail) {
    const err = new Error('Teacher email is required when creating a new teacher for a division');
    err.statusCode = 400;
    throw err;
  }

  const plainPassword = div.teacher_password || 'teacher123';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const [newTeacher] = await sequelize.query(
    `INSERT INTO teachers (school_id, name, email, phone, password, subject, status, created_at, updated_at)
     VALUES (:school_id, :name, :email, :phone, :password, :subject, 'Active', NOW(), NOW())
     RETURNING id`,
    {
      replacements: {
        school_id: schoolId,
        name: teacherName || 'New Teacher',
        email: teacherEmail,
        phone: div.teacher_phone?.trim() || null,
        password: hashedPassword,
        subject: div.teacher_subject?.trim() || null
      },
      type: QueryTypes.SELECT,
      transaction
    }
  );

  teacherCacheByEmail.set(normalizedEmail, newTeacher.id);
  return newTeacher.id;
}

// -------------------- Add Division --------------------
exports.addDivision = async (req, res) => {
  try {
    const school_id = req.user?.school_id;
    let { class_name, division_name, class_teacher, teacher_id, expected_students } = req.body;

    if (!school_id) return res.status(401).json({ success: false, message: 'Unauthorized: School info missing.' });
    if (!class_name || !division_name) return res.status(400).json({ success: false, message: 'Class and Division required.' });

    class_name = class_name.trim();
    division_name = division_name.trim();
    class_teacher = class_teacher?.trim() || null;
    expected_students = Number(expected_students) || 0;

    // Get class_id from class_name and school_id
    const [classData] = await sequelize.query(
      `SELECT id FROM classes WHERE school_id = :school_id AND LOWER(class_name) = LOWER(:class_name)`,
      { replacements: { school_id, class_name }, type: QueryTypes.SELECT }
    );

    if (!classData || !classData.id) {
      return res.status(404).json({
        success: false,
        message: `Class '${class_name}' not found for this school.`
      });
    }

    const class_id = classData.id;

    const existingDivision = await sequelize.query(
      `SELECT id FROM divisions WHERE class_id = :class_id AND LOWER(division_name) = LOWER(:division_name)`,
      { replacements: { class_id, division_name }, type: QueryTypes.SELECT }
    );

    if (existingDivision.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Division '${division_name}' already exists for class '${class_name}'.`
      });
    }

    // --- ONE TEACHER ONE CLASS CHECK ---
    if (teacher_id || class_teacher) {
      const checkQuery = `
        SELECT d.division_name, d.class_name 
        FROM divisions d
        INNER JOIN classes c ON d.class_id = c.id
        WHERE c.school_id = :school_id 
        AND (d.teacher_id = :teacher_id OR (d.class_teacher = :class_teacher AND d.teacher_id IS NULL))
        LIMIT 1
      `;
      const assignment = await sequelize.query(checkQuery, {
        replacements: { school_id, teacher_id: teacher_id || null, class_teacher: class_teacher || null },
        type: QueryTypes.SELECT
      });

      if (assignment.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Teacher is already assigned to Class ${assignment[0].class_name} - ${assignment[0].division_name}.`
        });
      }

      // Sync Name
      if (teacher_id && !class_teacher) {
        const teacherData = await sequelize.query(
          `SELECT name FROM teachers WHERE id = :teacher_id AND school_id = :school_id`,
          { replacements: { teacher_id, school_id }, type: QueryTypes.SELECT }
        );
        if (teacherData.length > 0) class_teacher = teacherData[0].name;
      }
    }

    const [insertedDivision] = await sequelize.query(
      `INSERT INTO divisions (class_id, class_name, division_name, class_teacher, teacher_id, expected_students, created_at, updated_at)
       VALUES (:class_id, :class_name, :division_name, :class_teacher, :teacher_id, :expected_students, NOW(), NOW())
       RETURNING id, division_name, class_teacher, teacher_id, expected_students, created_at, updated_at`,
      {
        replacements: {
          class_id,
          class_name,
          division_name,
          class_teacher,
          teacher_id: teacher_id || null,
          expected_students
        },
        type: QueryTypes.SELECT
      }
    );

    res.status(201).json({ success: true, message: '✅ Division added successfully', data: insertedDivision });

  } catch (error) {
    console.error('❌ Add Division Error:', error);
    res.status(500).json({ success: false, message: 'Server error while adding division' });
  }
};

// ---------------- Trust Creates School + Classes + Divisions ----------------
const createSchoolByTrust = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const trustId = req.user?.id;
    if (!trustId) return res.status(401).json({ success: false, message: 'Unauthorized: Trust ID missing' });

    const { schoolName, email, phone, address, city, state, country, pincode, pinCode, pin_code, password, section, classes } = req.body;
    const finalPincode = pincode || pinCode || pin_code || null;
    if (!schoolName || !password) return res.status(400).json({ success: false, message: 'School name and password required' });
    if (!section) return res.status(400).json({ success: false, message: 'Section is required (e.g., Pre-Primary, Primary, Secondary, Higher Secondary)' });

    // Email uniqueness
    if (email) {
      const existingSchool = await sequelize.query(`SELECT id FROM schools WHERE email = :email LIMIT 1`, { replacements: { email }, type: QueryTypes.SELECT, transaction: t });
      if (existingSchool.length > 0) { await t.rollback(); return res.status(409).json({ success: false, message: 'Email already exists.' }); }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ---------------- Generate custom_id and school_code for school ----------------
    const lastSchool = await sequelize.query(
      `SELECT custom_id, school_code FROM schools WHERE (custom_id LIKE 'SCH-%' OR school_code LIKE 'SCH-%') ORDER BY id DESC LIMIT 1`,
      { type: QueryTypes.SELECT, transaction: t }
    );

    let newSchoolId = 'SCH-001';
    let generatedSchoolCode = 'SCH-001';

    if (lastSchool.length > 0) {
      // Try to get number from custom_id or school_code
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

    // Ensure school_code is unique (in case of any conflicts)
    let finalSchoolCode = generatedSchoolCode;
    let counter = 1;
    while (true) {
      const existingCode = await sequelize.query(
        `SELECT id FROM schools WHERE school_code = :school_code LIMIT 1`,
        { replacements: { school_code: finalSchoolCode }, type: QueryTypes.SELECT, transaction: t }
      );
      if (existingCode.length === 0) break;
      const baseNumber = parseInt(generatedSchoolCode.split('-')[1]) + counter;
      finalSchoolCode = `SCH-${String(baseNumber).padStart(3, '0')}`;
      counter++;
    }

    const [school] = await sequelize.query(
      `INSERT INTO schools (trust_id, school_name, school_code, email, phone, address, city, state, pincode, password, section, custom_id, created_at, updated_at)
       VALUES (:trust_id, :school_name, :school_code, :email, :phone, :address, :city, :state, :pincode, :password, :section, :custom_id, NOW(), NOW()) RETURNING *;`,
      { replacements: { trust_id: trustId, school_name: schoolName, school_code: finalSchoolCode, email: email || null, phone: phone || null, address: address || null, city: city || null, state: state || null, pincode: finalPincode, password: hashedPassword, section: section, custom_id: newSchoolId }, type: QueryTypes.SELECT, transaction: t }
    );

    if (!school) { await t.rollback(); return res.status(500).json({ success: false, message: 'Failed to create school.' }); }

    // ---------------- Group classes & divisions ----------------
    // New structure: classes array contains class_name and divisions array
    // Section is now at school level, not class level
    const groupedClasses = new Map();
    if (Array.isArray(classes)) {
      for (const classItem of classes) {
        if (!classItem.class_name) continue;
        const key = classItem.class_name; // No section in key anymore

        if (!groupedClasses.has(key)) {
          groupedClasses.set(key, {
            class_name: classItem.class_name,
            divisions: []
          });
        }

        // Handle nested divisions array
        if (Array.isArray(classItem.divisions)) {
          for (const div of classItem.divisions) {
            if (div.division_name) {
              groupedClasses.get(key).divisions.push({
                division_name: div.division_name,
                class_teacher: div.class_teacher || null,
                teacher_id: div.teacher_id || null,
                teacher_email: div.teacher_email || null,
                teacher_password: div.teacher_password || null,
                teacher_phone: div.teacher_phone || null,
                teacher_subject: div.teacher_subject || null,
                expected_students: Number(div.expected_students) || 0
              });
            }
          }
        }
      }
    }

    const finalInsertedClasses = [];
    const teacherCacheByEmail = new Map();
    const assignedInBatch = new Set();

    for (const cls of groupedClasses.values()) {
      // Insert class WITHOUT section (section comes from school)
      const [insertedClass] = await sequelize.query(
        `INSERT INTO classes (school_id, class_name, created_at, updated_at)
         VALUES (:school_id, :class_name, NOW(), NOW())
         RETURNING id, school_id, class_name, created_at, updated_at;`,
        { replacements: { school_id: school.id, class_name: cls.class_name }, type: QueryTypes.SELECT, transaction: t }
      );

      insertedClass.divisions = [];
      for (const div of cls.divisions) {
        let finalTeacherId = null;
        try {
          finalTeacherId = await resolveTeacherForDivision(
            school.id,
            div,
            teacherCacheByEmail,
            t
          );
        } catch (teacherErr) {
          await t.rollback();
          return res.status(teacherErr.statusCode || 400).json({
            success: false,
            message: teacherErr.message || 'Invalid teacher details for division'
          });
        }

        let resolvedClassTeacher = div.class_teacher;
        try {
          const resolved = await assertTeacherAvailableForDivision({
            schoolId: school.id,
            teacherId: finalTeacherId,
            classTeacher: div.class_teacher,
            assignedInBatch,
            transaction: t,
          });
          finalTeacherId = resolved.teacherId;
          resolvedClassTeacher = resolved.classTeacher;
        } catch (teacherErr) {
          await t.rollback();
          return res.status(teacherErr.statusCode || 409).json({
            success: false,
            message: teacherErr.message,
          });
        }

        const [insertedDivision] = await sequelize.query(
          `INSERT INTO divisions (class_id, class_name, division_name, class_teacher, teacher_id, expected_students, created_at, updated_at)
           VALUES (:class_id, :class_name, :division_name, :class_teacher, :teacher_id, :expected_students, NOW(), NOW())
           RETURNING id, division_name, class_teacher, teacher_id, expected_students, created_at, updated_at;`,
          {
            replacements: {
              class_id: insertedClass.id,
              class_name: cls.class_name,
              division_name: div.division_name,
              class_teacher: resolvedClassTeacher,
              teacher_id: finalTeacherId,
              expected_students: div.expected_students
            },
            type: QueryTypes.SELECT,
            transaction: t
          }
        );
        insertedClass.divisions.push(insertedDivision);
      }

      finalInsertedClasses.push(insertedClass);
    }

    school.classes = finalInsertedClasses;
    await t.commit();

    delete school.password;
    return res.status(201).json({ success: true, message: '✅ School with section, classes and divisions added successfully by Trust', data: school });

  } catch (err) {
    await t.rollback();
    console.error('Create School by Trust Error:', err);
    let userMessage = 'Server error while creating school, classes, and divisions';
    if (err.message && (err.message.includes('duplicate key') || err.message.includes('unique constraint'))) {
      userMessage = 'Database conflict: A school code or class/division name may already exist.';
    }
    return res.status(500).json({ success: false, message: userMessage });
  }
};

// ---------------- Get All Schools under Trust ----------------
const getSchoolsByTrust = async (req, res) => {
  try {
    const trustId = req.user?.id;
    if (!trustId)
      return res.status(401).json({ success: false, message: 'Unauthorized: Trust ID missing' });

    const results = await sequelize.query(
      `SELECT s.id AS school_id, s.custom_id, s.trust_id, s.school_name, s.school_code, s.email AS school_email, s.phone AS school_phone, s.address, s.city, s.state, s.pincode, s.section AS school_section, s.created_at AS school_created_at, s.updated_at AS school_updated_at,
              c.id AS class_id, c.class_name, c.created_at AS class_created_at, c.updated_at AS class_updated_at,
              d.id AS division_id, d.division_name, d.class_teacher, d.expected_students, d.created_at AS division_created_at, d.updated_at AS division_updated_at
       FROM schools s
       LEFT JOIN classes c ON s.id = c.school_id
       LEFT JOIN divisions d ON c.id = d.class_id
       WHERE s.trust_id = :trust_id
       ORDER BY s.id DESC, c.id ASC, d.id ASC`,
      { replacements: { trust_id: trustId }, type: QueryTypes.SELECT }
    );

    const schoolsMap = new Map();

    for (const row of results) {
      if (!row.school_id) continue;

      if (!schoolsMap.has(row.school_id)) {
        schoolsMap.set(row.school_id, {
          id: row.school_id,
          custom_id: row.custom_id,
          trust_id: row.trust_id,
          school_name: row.school_name,
          school_code: row.school_code,
          section: row.school_section || null, // ✅ Correct section from DB
          email: row.school_email,
          phone: row.school_phone,
          address: row.address,
          city: row.city || null,
          state: row.state || null,
          pincode: row.pincode || null,
          created_at: row.school_created_at,
          updated_at: row.school_updated_at,
          classes: new Map()
        });
      }

      const school = schoolsMap.get(row.school_id);
      if (!school) continue;

      if (row.class_id) {
        if (!school.classes.has(row.class_id)) {
          school.classes.set(row.class_id, {
            id: row.class_id,
            class_name: row.class_name,
            created_at: row.class_created_at,
            updated_at: row.class_updated_at,
            divisions: []
          });
        }

        if (row.division_id) {
          const classData = school.classes.get(row.class_id);
          if (classData) {
            classData.divisions.push({
              id: row.division_id,
              division_name: row.division_name,
              class_teacher: row.class_teacher,
              expected_students: row.expected_students,
              created_at: row.division_created_at,
              updated_at: row.division_updated_at
            });
          }
        }
      }
    }

    const schools = Array.from(schoolsMap.values()).map(school => ({
      ...school,
      classes: Array.from(school.classes.values())
    }));

    return res.status(200).json({
      success: true,
      message: schools.length ? '✅ Schools fetched successfully' : '⚠️ No schools found under this trust',
      data: schools
    });

  } catch (err) {
    console.error('Get Schools by Trust Error:', err);
    return res.status(500).json({ success: false, message: 'Server error while fetching schools' });
  }
};


// ---------------- Get Teachers by School ----------------
const getTeachersBySchool = async (req, res) => {
  try {
    const trustId = req.user?.id;
    const { school_id } = req.params;

    if (!trustId) return res.status(401).json({ success: false, message: 'Unauthorized: Trust ID missing' });
    if (!school_id) return res.status(400).json({ success: false, message: 'School ID is required' });

    // Verify school belongs to trust
    const schoolCheck = await sequelize.query(
      `SELECT id FROM schools WHERE id = :school_id AND trust_id = :trust_id`,
      { replacements: { school_id, trust_id: trustId }, type: QueryTypes.SELECT }
    );

    if (!schoolCheck.length) {
      return res.status(403).json({ success: false, message: 'School not found or unauthorized' });
    }

    const teachers = await sequelize.query(
      `SELECT id, name, email, phone, school_id, subject, status, created_at, updated_at 
       FROM teachers 
       WHERE school_id = :school_id 
       ORDER BY name ASC`,
      { replacements: { school_id }, type: QueryTypes.SELECT }
    );

    return res.status(200).json({ success: true, data: teachers });
  } catch (error) {
    console.error('Get Teachers Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching teachers' });
  }
};

// ---------------- Create Teacher for School (Quick Create) ----------------
const createTeacherForSchool = async (req, res) => {
  try {
    const trustId = req.user?.id;
    const { school_id } = req.params;
    const { name, email, phone, password, subject, status } = req.body;

    if (!trustId) return res.status(401).json({ success: false, message: 'Unauthorized: Trust ID missing' });
    if (!school_id) return res.status(400).json({ success: false, message: 'School ID is required' });

    // Verify school belongs to trust
    const schoolCheck = await sequelize.query(
      `SELECT id FROM schools WHERE id = :school_id AND trust_id = :trust_id`,
      { replacements: { school_id, trust_id: trustId }, type: QueryTypes.SELECT }
    );

    if (!schoolCheck.length) {
      return res.status(403).json({ success: false, message: 'School not found or unauthorized' });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    // Check duplicate email within the school
    const existing = await sequelize.query(
      `SELECT id FROM teachers WHERE LOWER(email) = LOWER(:email) AND school_id = :school_id`,
      { replacements: { email: email.trim(), school_id }, type: QueryTypes.SELECT }
    );

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Teacher with this email already exists in this school' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [teacher] = await sequelize.query(
      `INSERT INTO teachers (school_id, name, email, phone, password, subject, status, created_at, updated_at)
       VALUES (:school_id, :name, :email, :phone, :password, :subject, :status, NOW(), NOW())
       RETURNING id, name, email, phone, subject, status, school_id, created_at, updated_at`,
      {
        replacements: {
          school_id,
          name: name.trim(),
          email: email.trim(),
          phone: phone ? phone.trim() : null,
          password: hashedPassword,
          subject: subject ? subject.trim() : null,
          status: status || 'Active'
        },
        type: QueryTypes.SELECT
      }
    );

    return res.status(201).json({ success: true, message: 'Teacher created successfully', data: teacher });
  } catch (error) {
    console.error('Create Teacher Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while creating teacher' });
  }
};

// ---------------- Update School by Trust ---------------- 
const updateSchoolByTrust = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const trustId = req.user?.id;
    const { school_id } = req.params;
    const { schoolName, email, phone, address, section, password, classes, pincode, pinCode, pin_code } = req.body;
    const finalPincode = pincode || pinCode || pin_code;
    // Note: school_code is auto-generated and cannot be changed

    if (!trustId) return res.status(401).json({ success: false, message: 'Unauthorized: Trust ID missing' });
    if (!school_id) return res.status(400).json({ success: false, message: 'School ID is required' });

    // Verify school belongs to trust
    const schoolCheck = await sequelize.query(
      `SELECT id FROM schools WHERE id = :school_id AND trust_id = :trust_id`,
      { replacements: { school_id, trust_id: trustId }, type: QueryTypes.SELECT }
    );

    if (!schoolCheck.length) {
      return res.status(403).json({ success: false, message: 'School not found or unauthorized' });
    }

    // Build update fields dynamically
    const updateFields = [];
    const replacements = { school_id, trust_id: trustId };

    if (schoolName) {
      updateFields.push('school_name = :school_name');
      replacements.school_name = schoolName.trim();
    }
    // school_code is auto-generated and cannot be updated
    if (email) {
      updateFields.push('email = :email');
      replacements.email = email.trim();
    }
    if (phone) {
      updateFields.push('phone = :phone');
      replacements.phone = phone.trim();
    }
    if (address) {
      updateFields.push('address = :address');
      replacements.address = address.trim();
    }
    if (section) {
      updateFields.push('section = :section');
      replacements.section = section.trim();
    }
    if (finalPincode) {
      updateFields.push('pincode = :pincode');
      replacements.pincode = finalPincode.toString().trim();
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password = :password');
      replacements.password = hashedPassword;
    }

    // Update school basic info if there are fields to update
    if (updateFields.length > 0) {
      updateFields.push('updated_at = NOW()');
      const query = `
        UPDATE schools
        SET ${updateFields.join(', ')}
        WHERE id = :school_id AND trust_id = :trust_id
        RETURNING id, custom_id, trust_id, school_name, school_code, section, email, phone, address, created_at, updated_at;
      `;
      await sequelize.query(query, { replacements, type: QueryTypes.UPDATE, transaction: t });
    }

    // Handle classes and divisions update if provided
    if (classes && Array.isArray(classes)) {
      const assignedInBatch = new Set();

      // Get existing classes for this school
      const existingClasses = await sequelize.query(
        `SELECT id, class_name FROM classes WHERE school_id = :school_id`,
        { replacements: { school_id }, type: QueryTypes.SELECT, transaction: t }
      );

      const existingClassMap = new Map(existingClasses.map(c => [c.class_name.toLowerCase(), c.id]));
      const newClassNames = new Set(classes.map(c => c.class_name.toLowerCase()));

      // Delete classes that are no longer in the update
      for (const existingClass of existingClasses) {
        if (!newClassNames.has(existingClass.class_name.toLowerCase())) {
          // Delete divisions first (cascade)
          await sequelize.query(
            `DELETE FROM divisions WHERE class_id = :class_id`,
            { replacements: { class_id: existingClass.id }, type: QueryTypes.DELETE, transaction: t }
          );
          // Delete class
          await sequelize.query(
            `DELETE FROM classes WHERE id = :class_id`,
            { replacements: { class_id: existingClass.id }, type: QueryTypes.DELETE, transaction: t }
          );
        }
      }

      // Process each class in the update
      for (const cls of classes) {
        let classId;
        const classNameLower = cls.class_name.toLowerCase();

        if (existingClassMap.has(classNameLower)) {
          // Update existing class
          classId = existingClassMap.get(classNameLower);
        } else {
          // Create new class
          const [insertedClass] = await sequelize.query(
            `INSERT INTO classes (school_id, class_name, created_at, updated_at)
             VALUES (:school_id, :class_name, NOW(), NOW())
             RETURNING id;`,
            { replacements: { school_id, class_name: cls.class_name.trim() }, type: QueryTypes.INSERT, transaction: t }
          );
          classId = Array.isArray(insertedClass) ? insertedClass[0].id : insertedClass.id;
        }

        // Handle divisions for this class
        if (cls.divisions && Array.isArray(cls.divisions)) {
          // Get existing divisions for this class
          const existingDivisions = await sequelize.query(
            `SELECT id, division_name FROM divisions WHERE class_id = :class_id`,
            { replacements: { class_id: classId }, type: QueryTypes.SELECT, transaction: t }
          );

          const existingDivisionMap = new Map(existingDivisions.map(d => [d.division_name.toLowerCase(), d.id]));
          const newDivisionNames = new Set(cls.divisions.map(d => d.division_name.toLowerCase()));

          // Delete divisions that are no longer in the update
          for (const existingDiv of existingDivisions) {
            if (!newDivisionNames.has(existingDiv.division_name.toLowerCase())) {
              await sequelize.query(
                `DELETE FROM divisions WHERE id = :division_id`,
                { replacements: { division_id: existingDiv.id }, type: QueryTypes.DELETE, transaction: t }
              );
            }
          }

          // Process each division
          for (const div of cls.divisions) {
            const divisionNameLower = div.division_name.toLowerCase();
            const excludeDivisionId = existingDivisionMap.has(divisionNameLower)
              ? existingDivisionMap.get(divisionNameLower)
              : null;

            let resolvedTeacher;
            try {
              resolvedTeacher = await assertTeacherAvailableForDivision({
                schoolId: school_id,
                teacherId: div.teacher_id || null,
                classTeacher: div.class_teacher || null,
                excludeDivisionId,
                assignedInBatch,
                transaction: t,
              });
            } catch (teacherErr) {
              await t.rollback();
              return res.status(teacherErr.statusCode || 409).json({
                success: false,
                message: teacherErr.message,
              });
            }

            const finalTeacherId = resolvedTeacher?.teacherId || null;
            const finalClassTeacher = resolvedTeacher?.classTeacher || div.class_teacher?.trim() || null;

            if (existingDivisionMap.has(divisionNameLower)) {
              // Update existing division
              const divisionId = existingDivisionMap.get(divisionNameLower);
              await sequelize.query(
                `UPDATE divisions 
                 SET class_teacher = COALESCE(:class_teacher, class_teacher),
                     teacher_id = :teacher_id,
                     expected_students = :expected_students,
                     updated_at = NOW()
                 WHERE id = :division_id`,
                {
                  replacements: {
                    division_id: divisionId,
                    class_teacher: finalClassTeacher,
                    teacher_id: finalTeacherId,
                    expected_students: div.expected_students || 0
                  },
                  type: QueryTypes.UPDATE,
                  transaction: t
                }
              );
            } else {
              // Create new division
              await sequelize.query(
                `INSERT INTO divisions (class_id, class_name, division_name, class_teacher, teacher_id, expected_students, created_at, updated_at)
                 VALUES (:class_id, :class_name, :division_name, :class_teacher, :teacher_id, :expected_students, NOW(), NOW())`,
                {
                  replacements: {
                    class_id: classId,
                    class_name: cls.class_name.trim(),
                    division_name: div.division_name.trim(),
                    class_teacher: finalClassTeacher,
                    teacher_id: finalTeacherId,
                    expected_students: div.expected_students || 0
                  },
                  type: QueryTypes.INSERT,
                  transaction: t
                }
              );
            }
          }
        }
      }
    }

    await t.commit();

    return res.status(200).json({
      success: true,
      message: 'School updated successfully with classes and divisions',
      data: { id: parseInt(school_id) }
    });

  } catch (error) {
    await t.rollback();
    console.error('Update School Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while updating school' });
  }
};

// ---------------- Delete School by Trust ---------------- 
const deleteSchoolByTrust = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const trustId = req.user?.id;
    const { school_id } = req.params;

    if (!trustId) {
      await t.rollback();
      return res.status(401).json({ success: false, message: 'Unauthorized: Trust ID missing' });
    }
    if (!school_id) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'School ID is required' });
    }

    // Verify school belongs to trust
    const schoolCheck = await sequelize.query(
      `SELECT id, school_name FROM schools WHERE id = :school_id AND trust_id = :trust_id`,
      { replacements: { school_id, trust_id: trustId }, type: QueryTypes.SELECT, transaction: t }
    );

    if (!schoolCheck.length) {
      await t.rollback();
      return res.status(403).json({ success: false, message: 'School not found or unauthorized' });
    }

    const schoolName = schoolCheck[0].school_name;

    // Delete in cascade order (bottom-up to respect FKs)
    // 1. Delete Student Generated IDs
    await sequelize.query(
      `DELETE FROM student_generated_ids WHERE school_id = :school_id`,
      { replacements: { school_id }, type: QueryTypes.DELETE, transaction: t }
    );

    // 2. Delete School Calendar
    await sequelize.query(
      `DELETE FROM school_calendar WHERE school_id = :school_id`,
      { replacements: { school_id }, type: QueryTypes.DELETE, transaction: t }
    );

    // 3. Delete Fee Installments and Plans
    // First installments (they have fee_plan_id)
    await sequelize.query(
      `DELETE FROM school_fee_installments WHERE fee_plan_id IN (SELECT id FROM school_fee_plans WHERE school_id = :school_id)`,
      { replacements: { school_id }, type: QueryTypes.DELETE, transaction: t }
    );
    // Then plans
    await sequelize.query(
      `DELETE FROM school_fee_plans WHERE school_id = :school_id`,
      { replacements: { school_id }, type: QueryTypes.DELETE, transaction: t }
    );

    // 4. Delete students (via classes)
    await sequelize.query(
      `DELETE FROM students WHERE class_id IN (SELECT id FROM classes WHERE school_id = :school_id)`,
      { replacements: { school_id }, type: QueryTypes.DELETE, transaction: t }
    );

    // 5. Delete student forms
    await sequelize.query(
      `DELETE FROM student_forms WHERE school_id = :school_id`,
      { replacements: { school_id }, type: QueryTypes.DELETE, transaction: t }
    );

    // 6. Delete divisions
    await sequelize.query(
      `DELETE FROM divisions WHERE class_id IN (SELECT id FROM classes WHERE school_id = :school_id)`,
      { replacements: { school_id }, type: QueryTypes.DELETE, transaction: t }
    );

    // 7. Delete classes
    await sequelize.query(
      `DELETE FROM classes WHERE school_id = :school_id`,
      { replacements: { school_id }, type: QueryTypes.DELETE, transaction: t }
    );

    // 8. Delete teachers
    await sequelize.query(
      `DELETE FROM teachers WHERE school_id = :school_id`,
      { replacements: { school_id }, type: QueryTypes.DELETE, transaction: t }
    );

    // 9. Delete the school
    await sequelize.query(
      `DELETE FROM schools WHERE id = :school_id AND trust_id = :trust_id`,
      { replacements: { school_id, trust_id: trustId }, type: QueryTypes.DELETE, transaction: t }
    );

    await t.commit();

    return res.status(200).json({
      success: true,
      message: `School "${schoolName}" and all associated data deleted successfully`
    });

  } catch (error) {
    if (t) await t.rollback();
    console.error('Delete School Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while deleting school' });
  }
};

// =======================
// GET SCHOOL CREDENTIALS
// =======================
const getSchoolCredentials = async (req, res) => {
  try {
    const trustId = req.user?.id;
    const { school_id } = req.params;

    if (!trustId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Verify school belongs to trust
    const school = await sequelize.query(
      `SELECT id, school_name, email, school_code, section, created_at 
       FROM schools 
       WHERE id = :school_id AND trust_id = :trust_id`,
      { replacements: { school_id, trust_id: trustId }, type: QueryTypes.SELECT }
    );

    if (!school.length) {
      return res.status(403).json({ success: false, message: 'School not found or unauthorized' });
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
// RESET SCHOOL PASSWORD
// =======================
const resetSchoolPassword = async (req, res) => {
  try {
    const trustId = req.user?.id;
    const { school_id } = req.params;
    const { newPassword, sendEmail } = req.body;

    if (!trustId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Verify school belongs to trust
    const school = await sequelize.query(
      `SELECT id, school_name, email FROM schools WHERE id = :school_id AND trust_id = :trust_id`,
      { replacements: { school_id, trust_id: trustId }, type: QueryTypes.SELECT }
    );

    if (!school.length) {
      return res.status(403).json({ success: false, message: 'School not found or unauthorized' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await sequelize.query(
      `UPDATE schools SET password = :password, updated_at = NOW() WHERE id = :school_id`,
      { replacements: { password: hashedPassword, school_id }, type: QueryTypes.UPDATE }
    );

    // TODO: Send email if sendEmail is true
    if (sendEmail) {
      console.log(`Password reset email should be sent to ${school[0].email}`);
    }

    res.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        email: school[0].email,
        newPassword: sendEmail ? null : newPassword // Only return password if not sending email
      }
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =======================
// SEND CREDENTIALS VIA EMAIL
// =======================
const sendSchoolCredentials = async (req, res) => {
  try {
    const trustId = req.user?.id;
    const { school_id } = req.params;
    const { email, password } = req.body;

    if (!trustId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Verify school belongs to trust
    const school = await sequelize.query(
      `SELECT id, school_name, email, school_code, section 
       FROM schools 
       WHERE id = :school_id AND trust_id = :trust_id`,
      { replacements: { school_id, trust_id: trustId }, type: QueryTypes.SELECT }
    );

    if (!school.length) {
      return res.status(403).json({ success: false, message: 'School not found or unauthorized' });
    }

    const recipientEmail = email || school[0].email;
    const loginPassword = password; // Password should be provided or generated

    // TODO: Implement email sending
    // Use nodemailer or similar service
    const emailContent = {
      to: recipientEmail,
      subject: `School Login Credentials - ${school[0].school_name}`,
      html: `
        <h2>School Login Credentials</h2>
        <p>Dear School Administrator,</p>
        <p>Your school has been registered on the ID CRM platform. Please find your login credentials below:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>School Name:</strong> ${school[0].school_name}</p>
          <p><strong>School Code:</strong> ${school[0].school_code}</p>
          <p><strong>Section:</strong> ${school[0].section}</p>
          <p><strong>Login Email:</strong> ${school[0].email}</p>
          <p><strong>Password:</strong> ${loginPassword || '[Password set during creation]'}</p>
          <p><strong>Login URL:</strong> ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login</p>
        </div>
        <p>Please keep these credentials secure and change your password after first login.</p>
        <p>Best regards,<br>ID CRM Platform</p>
      `
    };

    // Placeholder for email sending
    console.log('Email should be sent:', emailContent);

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
// TRUST ADMIN: CREATE CLASS FOR SCHOOL
// =======================
const createClassForSchool = async (req, res) => {
  try {
    const trustId = req.user?.id;
    const { school_id } = req.params;
    const { class_name } = req.body;

    if (!trustId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Trust ID missing' });
    }

    if (!class_name) {
      return res.status(400).json({ success: false, message: 'Class name is required' });
    }

    // Verify school belongs to trust
    const school = await sequelize.query(
      `SELECT id, section FROM schools WHERE id = :school_id AND trust_id = :trust_id`,
      { replacements: { school_id, trust_id: trustId }, type: QueryTypes.SELECT }
    );

    if (!school.length) {
      return res.status(403).json({ success: false, message: 'School not found or unauthorized' });
    }

    // Check if class already exists
    const existingClass = await sequelize.query(
      `SELECT id FROM classes WHERE school_id = :school_id AND LOWER(class_name) = LOWER(:class_name)`,
      { replacements: { school_id, class_name: class_name.trim() }, type: QueryTypes.SELECT }
    );

    if (existingClass.length > 0) {
      return res.status(409).json({ success: false, message: 'Class already exists' });
    }

    const section = school[0].section || null;

    // Create class
    const [newClass] = await sequelize.query(
      `INSERT INTO classes (school_id, class_name, section, created_at, updated_at)
       VALUES (:school_id, :class_name, :section, NOW(), NOW())
       RETURNING *`,
      { replacements: { school_id, class_name: class_name.trim(), section }, type: QueryTypes.SELECT }
    );

    res.status(201).json({ success: true, message: 'Class created successfully', data: newClass });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =======================
// TRUST ADMIN: CREATE DIVISION FOR CLASS
// =======================
const createDivisionForClass = async (req, res) => {
  try {
    const trustId = req.user?.id;
    const { school_id, class_id } = req.params;
    let { division_name, class_teacher, teacher_id, expected_students } = req.body;

    if (!trustId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Trust ID missing' });
    }

    if (!division_name) {
      return res.status(400).json({ success: false, message: 'Division name is required' });
    }

    // Verify school belongs to trust
    const school = await sequelize.query(
      `SELECT id FROM schools WHERE id = :school_id AND trust_id = :trust_id`,
      { replacements: { school_id, trust_id: trustId }, type: QueryTypes.SELECT }
    );

    if (!school.length) {
      return res.status(403).json({ success: false, message: 'School not found or unauthorized' });
    }

    // Get class info
    const classData = await sequelize.query(
      `SELECT id, class_name FROM classes WHERE id = :class_id AND school_id = :school_id`,
      { replacements: { class_id, school_id }, type: QueryTypes.SELECT }
    );

    if (!classData.length) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    // Check if division already exists
    const existingDivision = await sequelize.query(
      `SELECT id FROM divisions WHERE class_id = :class_id AND LOWER(division_name) = LOWER(:division_name)`,
      { replacements: { class_id, division_name: division_name.trim() }, type: QueryTypes.SELECT }
    );

    if (existingDivision.length > 0) {
      return res.status(409).json({ success: false, message: 'Division already exists' });
    }

    // --- ONE TEACHER ONE CLASS CHECK ---
    if (teacher_id || class_teacher) {
      const checkQuery = `
        SELECT d.division_name, d.class_name 
        FROM divisions d
        INNER JOIN classes c ON d.class_id = c.id
        WHERE c.school_id = :school_id 
        AND (d.teacher_id = :teacher_id OR (d.class_teacher = :class_teacher AND d.teacher_id IS NULL))
        LIMIT 1
      `;
      const assignment = await sequelize.query(checkQuery, {
        replacements: { school_id, teacher_id: teacher_id || null, class_teacher: class_teacher || null },
        type: QueryTypes.SELECT
      });

      if (assignment.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Teacher is already assigned to Class ${assignment[0].class_name} - ${assignment[0].division_name}. One teacher can only be assigned to one class.`
        });
      }

      // Sync name
      if (teacher_id && !class_teacher) {
        const teacherData = await sequelize.query(
          `SELECT name FROM teachers WHERE id = :teacher_id AND school_id = :school_id`,
          { replacements: { teacher_id, school_id }, type: QueryTypes.SELECT }
        );
        if (teacherData.length > 0) class_teacher = teacherData[0].name;
      }
    }

    // Create division
    const [newDivision] = await sequelize.query(
      `INSERT INTO divisions (class_id, class_name, division_name, class_teacher, teacher_id, expected_students, created_at, updated_at)
       VALUES (:class_id, :class_name, :division_name, :class_teacher, :teacher_id, :expected_students, NOW(), NOW())
       RETURNING id, division_name, class_teacher, teacher_id, expected_students, created_at, updated_at;`,
      {
        replacements: {
          class_id,
          class_name: classData[0].class_name,
          division_name: division_name.trim(),
          class_teacher: class_teacher?.trim() || null,
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
// TRUST ADMIN: GET ALL CLASSES FOR SCHOOL
// =======================
const getClassesForSchool = async (req, res) => {
  try {
    const trustId = req.user?.id;
    const { school_id } = req.params;

    if (!trustId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Verify school belongs to trust
    const school = await sequelize.query(
      `SELECT id FROM schools WHERE id = :school_id AND trust_id = :trust_id`,
      { replacements: { school_id, trust_id: trustId }, type: QueryTypes.SELECT }
    );

    if (!school.length) {
      return res.status(403).json({ success: false, message: 'School not found or unauthorized' });
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
       WHERE c.school_id = :school_id
       GROUP BY c.id, c.class_name, c.section, c.created_at
       ORDER BY c.class_name`,
      { replacements: { school_id }, type: QueryTypes.SELECT }
    );

    res.json({ success: true, data: classes });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =======================
// TRUST ADMIN: UPDATE TEACHER
// =======================
const updateTeacherForSchool = async (req, res) => {
  try {
    const trustId = req.user?.id;
    const { school_id, teacher_id } = req.params;
    const updates = req.body;

    if (!trustId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Verify school belongs to trust
    const school = await sequelize.query(
      `SELECT id FROM schools WHERE id = :school_id AND trust_id = :trust_id`,
      { replacements: { school_id, trust_id: trustId }, type: QueryTypes.SELECT }
    );

    if (!school.length) {
      return res.status(403).json({ success: false, message: 'School not found or unauthorized' });
    }

    // Verify teacher belongs to school
    const teacher = await sequelize.query(
      `SELECT id FROM teachers WHERE id = :teacher_id AND school_id = :school_id`,
      { replacements: { teacher_id, school_id }, type: QueryTypes.SELECT }
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
// TRUST ADMIN: DELETE TEACHER
// =======================
const deleteTeacherForSchool = async (req, res) => {
  try {
    const trustId = req.user?.id;
    const { school_id, teacher_id } = req.params;

    if (!trustId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Verify school belongs to trust
    const school = await sequelize.query(
      `SELECT id FROM schools WHERE id = :school_id AND trust_id = :trust_id`,
      { replacements: { school_id, trust_id: trustId }, type: QueryTypes.SELECT }
    );

    if (!school.length) {
      return res.status(403).json({ success: false, message: 'School not found or unauthorized' });
    }

    // Verify teacher belongs to school
    const teacher = await sequelize.query(
      `SELECT id FROM teachers WHERE id = :teacher_id AND school_id = :school_id`,
      { replacements: { teacher_id, school_id }, type: QueryTypes.SELECT }
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

module.exports = {
  createSchoolByTrust,
  getSchoolsByTrust,
  addDivision: exports.addDivision,
  getTeachersBySchool,
  createTeacherForSchool,
  updateSchoolByTrust,
  deleteSchoolByTrust,
  getSchoolCredentials,
  resetSchoolPassword,
  sendSchoolCredentials,
  createClassForSchool,
  createDivisionForClass,
  getClassesForSchool,
  updateTeacherForSchool,
  deleteTeacherForSchool
};
