const { QueryTypes } = require('sequelize');
const sequelize = require('../../config/db');

// ---------------- Add Student ----------------
exports.addStudent = async (req, res) => {
  try {
    // Logged-in school from token
    const school_id = req.user?.school_id;
    if (!school_id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: School information not found in token.' });
    }

    const { name, roll_number, parent_phone, class_name, division_name } = req.body;

    // Validate required fields
    if (!name || !class_name || !division_name) {
      return res.status(400).json({
        success: false,
        message: 'Name, Class Name, and Division Name are required'
      });
    }

    // Trim input
    const trimmedClassName = class_name.trim();
    const trimmedDivisionName = division_name.trim();
    const trimmedName = name.trim();
    const trimmedParentPhone = parent_phone?.trim() || null;

    // Fetch class_id from class_name
    const classResult = await sequelize.query(
      `SELECT id FROM classes WHERE school_id = :school_id AND LOWER(class_name) = LOWER(:class_name) LIMIT 1`,
      { replacements: { school_id, class_name: trimmedClassName }, type: QueryTypes.SELECT }
    );

    if (classResult.length === 0) {
      return res.status(404).json({ success: false, message: `Class '${trimmedClassName}' not found in your school` });
    }
    const class_id = classResult[0].id;

    // Fetch division_id from division_name and class_name (no class_id in divisions table)
    const divisionResult = await sequelize.query(
      `SELECT id FROM divisions WHERE LOWER(class_name) = LOWER(:class_name) AND LOWER(division_name) = LOWER(:division_name) LIMIT 1`,
      { replacements: { class_name: trimmedClassName, division_name: trimmedDivisionName }, type: QueryTypes.SELECT }
    );

    if (divisionResult.length === 0) {
      return res.status(404).json({ success: false, message: `Division '${trimmedDivisionName}' not found for class '${trimmedClassName}'` });
    }
    const division_id = divisionResult[0].id;

    // Insert student
    const query = `
     INSERT INTO students (school_id, class_id, division_id, name, roll_number, parent_phone, "createdAt", "updatedAt")
VALUES (:school_id, :class_id, :division_id, :name, :roll_number, :parent_phone, NOW(), NOW())
RETURNING *;

    `;

    const replacements = { 
      school_id, 
      class_id, 
      division_id, 
      name: trimmedName, 
      roll_number: roll_number || null, 
      parent_phone: trimmedParentPhone 
    };

    const [result] = await sequelize.query(query, { replacements, type: QueryTypes.INSERT });

    res.status(201).json({ success: true, message: 'Student added successfully', data: result[0] });

  } catch (error) {
    console.error('Add Student Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ---------------- Get All Students for a School ----------------
exports.getStudents = async (req, res) => {
  try {
    const school_id = req.user?.school_id;
    if (!school_id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: School information not found in token.' });
    }

    const students = await sequelize.query(
      `SELECT s.id, s.name, s.roll_number, s.parent_phone, c.class_name, d.division_name
       FROM students s
       JOIN classes c ON s.class_id = c.id
       JOIN divisions d ON s.division_id = d.id
       WHERE s.school_id = :school_id
       ORDER BY s.id ASC;`,
      { replacements: { school_id }, type: QueryTypes.SELECT }
    );

    res.status(200).json({ success: true, data: students });

  } catch (error) {
    console.error('Get Students Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
