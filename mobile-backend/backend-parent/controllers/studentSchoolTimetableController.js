const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");

exports.getStudentSchoolTimetable = async (req, res) => {
    try {
        const student = req.student;

        if (!student || !student.class_id || !student.division_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized student or missing class/division info"
            });
        }

        const timetables = await sequelize.query(
            `SELECT id, title, media_url, status, created_at 
             FROM school_timetables
             WHERE class_id = :class_id 
             AND division_id = :division_id 
             AND is_deleted = false 
             AND status = 'active'
             ORDER BY created_at DESC`,
            {
                replacements: {
                    class_id: student.class_id,
                    division_id: student.division_id
                },
                type: QueryTypes.SELECT
            }
        );

        res.json({
            success: true,
            data: timetables
        });

    } catch (error) {
        console.error("Student Get School Timetable Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
