const { QueryTypes } = require('sequelize');
const sequelize = require('../../config/db');

// ---------------- Get Single Student by Form ID (Public – for QR scan) ----------------
exports.getStudentByFormId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }

    const query = `
      SELECT
        sf.id,
        sf.roll_number,
        TRIM(CONCAT_WS(' ', sf.first_name, sf.middle_name, sf.last_name)) AS student_name,
        sf.first_name, sf.middle_name, sf.last_name,
        sf.dob, sf.gender, sf.blood_group,
        sf.street_address, sf.city, sf.state, sf.pin_code,
        CONCAT_WS(', ', sf.street_address, sf.city, sf.state, sf.pin_code) AS address,
        sf.father_name, sf.mother_name,
        sf.father_phone, sf.mother_phone,
        sf.photo, sf.student_signature,
        c.class_name AS class,
        d.division_name AS division,
        CONCAT(c.class_name, ' - ', d.division_name) AS standard,
        sc.school_name,
        sc.logo AS school_logo
      FROM student_forms sf
      LEFT JOIN classes c ON sf.class_id = c.id
      LEFT JOIN divisions d ON sf.division_id = d.id
      LEFT JOIN schools sc ON sf.school_id = sc.id
      WHERE sf.id = :id AND sf.status = 'approved'
      LIMIT 1
    `;

    const result = await sequelize.query(query, {
      replacements: { id },
      type: QueryTypes.SELECT,
    });

    if (!result.length) {
      return res.status(404).json({ success: false, message: 'Student not found or not approved' });
    }

    // Resolve photo URL
    const student = result[0];
    const BACKEND_URL = process.env.BACKEND_URL || '';
    if (student.photo && !student.photo.startsWith('http')) {
      student.photo = `${BACKEND_URL}/${student.photo.replace(/^\//, '')}`;
    }
    if (student.school_logo && !student.school_logo.startsWith('http')) {
      student.school_logo = `${BACKEND_URL}/${student.school_logo.replace(/^\//, '')}`;
    }

    res.status(200).json({ success: true, student });
  } catch (error) {
    console.error('getStudentByFormId error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ---------------- Get All Approved Students by School ID ----------------
exports.getApprovedStudentsBySchool = async (req, res) => {
    try {
        const { school_id } = req.query;

        if (!school_id) {
            return res.status(400).json({
                success: false,
                message: 'School ID is required'
            });
        }

        const query = `
      SELECT 
        sf.roll_number,
        TRIM(CONCAT_WS(' ', sf.first_name, sf.middle_name, sf.last_name)) AS student_name,
        c.class_name,
        d.division_name
      FROM student_forms sf
      LEFT JOIN classes c ON sf.class_id = c.id
      LEFT JOIN divisions d ON sf.division_id = d.id
      WHERE sf.school_id = :school_id 
        AND sf.status = 'approved'
      ORDER BY sf.roll_number ASC;
    `;

        const studentsResult = await sequelize.query(query, {
            replacements: { school_id },
            type: QueryTypes.SELECT
        });

        res.status(200).json({
            success: true,
            message: 'Approved students fetched successfully',
            data: studentsResult
        });

    } catch (error) {
        console.error('Get Public Students List Error:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching student list' });
    }
};
