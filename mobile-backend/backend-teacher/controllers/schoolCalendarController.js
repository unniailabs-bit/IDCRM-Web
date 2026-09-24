const sequelize = require("../../config/db");

/**
 * GET SCHOOL CALENDAR
 * Fetches all calendar events for the teacher's school
 */
exports.getSchoolCalendar = async (req, res) => {
    try {
        const teacher = req.teacher;

        if (!teacher || !teacher.school_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const calendar = await sequelize.query(
            `
      SELECT 
        id,
        school_id,
        type,
        title,
        calendar_date,
        is_attendance_required,
        is_active,
        created_by,
        created_at,
        updated_at
      FROM school_calendar
      WHERE school_id = :school_id
        AND is_active = true
      ORDER BY calendar_date ASC
      `,
            {
                replacements: { school_id: teacher.school_id },
                type: sequelize.QueryTypes.SELECT
            }
        );

        res.json({
            success: true,
            count: calendar.length,
            calendar
        });

    } catch (err) {
        console.error("Get School Calendar Error:", err);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
