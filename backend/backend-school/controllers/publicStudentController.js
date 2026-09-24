const { QueryTypes } = require('sequelize');
const sequelize = require('../../config/db');

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
