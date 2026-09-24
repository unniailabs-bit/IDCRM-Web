const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");

/**
 * ======================================
 * ATTENDANCE SUMMARY
 * ======================================
 * Out of total students (teacher based)
 */
exports.getAttendanceSummary = async (req, res) => {
  try {
    const teacher = req.teacher;
    const { date, month, year } = req.query;

    let whereClause = "";
    let studentListSelect = "";
    const replacements = {
      teacher_id: teacher.id,
      school_id: teacher.school_id
    };

    // Determine the time period filter
    if (month && year) {
      whereClause = `EXTRACT(MONTH FROM date) = :month AND EXTRACT(YEAR FROM date) = :year`;
      replacements.month = month;
      replacements.year = year;
    } else if (year) {
      whereClause = `EXTRACT(YEAR FROM date) = :year`;
      replacements.year = year;
    } else {
      const targetDate = date || new Date().toISOString().slice(0, 10);
      whereClause = `date = :date`;
      replacements.date = targetDate;
    }

    // Total approved students
    const totalResult = await sequelize.query(
      `
      SELECT COUNT(*)::int AS total_students
      FROM student_forms
      WHERE division_id IN (SELECT id FROM divisions WHERE teacher_id = :teacher_id)
        AND school_id = :school_id
      `,
      {
        replacements,
        type: QueryTypes.SELECT
      }
    );

    // Attendance counts for the selected period (based on students in teacher's divisions)
    const attendanceResult = await sequelize.query(
      `
      SELECT
        COUNT(a.id) FILTER (WHERE a.status = 'present')::int AS present,
        COUNT(a.id) FILTER (WHERE a.status = 'absent')::int AS absent
      FROM attendance a
      JOIN student_forms sf ON a.student_id = sf.id
      WHERE ${whereClause.replace(/\bdate\b/g, 'a.date').replace(/:a\.date/g, ':date')}
        AND sf.division_id IN (SELECT id FROM divisions WHERE teacher_id = :teacher_id)
        AND sf.school_id = :school_id
      `,
      {
        replacements,
        type: QueryTypes.SELECT
      }
    );

    // Fetch student list with either a status (daily) or aggregate counts (period)
    let studentListQuery = "";
    if (month || year) {
      studentListQuery = `
        SELECT 
          sf.id AS student_id,
          sf.first_name, 
          sf.last_name, 
          sf.father_name,
          sf.father_phone,
          sf.roll_number, 
          c.class_name,
          d.division_name,
          COUNT(a.id) FILTER (WHERE a.status = 'present')::int as total_present,
          COUNT(a.id) FILTER (WHERE a.status = 'absent')::int as total_absent
        FROM student_forms sf
        LEFT JOIN classes c ON sf.class_id = c.id
        LEFT JOIN divisions d ON sf.division_id = d.id
        LEFT JOIN attendance a ON a.student_id = sf.id AND ${whereClause.replace(/\bdate\b/g, 'a.date').replace(/:a\.date/g, ':date')}
        WHERE sf.division_id IN (SELECT id FROM divisions WHERE teacher_id = :teacher_id)
          AND sf.school_id = :school_id
        GROUP BY sf.id, sf.first_name, sf.last_name, sf.roll_number, sf.father_phone, c.class_name, d.division_name
        ORDER BY sf.roll_number ASC
      `;
    } else {
      studentListQuery = `
        SELECT 
          sf.id AS student_id,
          sf.first_name, 
          sf.last_name, 
          sf.father_name,
          sf.father_phone,
          sf.roll_number, 
          c.class_name,
          d.division_name,
          COALESCE(a.status, 'not_marked') as status
        FROM student_forms sf
        LEFT JOIN classes c ON sf.class_id = c.id
        LEFT JOIN divisions d ON sf.division_id = d.id
        LEFT JOIN attendance a ON a.student_id = sf.id AND a.date = :date
        WHERE sf.division_id IN (SELECT id FROM divisions WHERE teacher_id = :teacher_id)
          AND sf.school_id = :school_id
        ORDER BY sf.roll_number ASC
      `;
    }

    const studentList = await sequelize.query(studentListQuery, {
      replacements,
      type: QueryTypes.SELECT
    });

    const total_students = totalResult[0].total_students;
    const present = attendanceResult[0].present || 0;
    const absent = attendanceResult[0].absent || 0;
    const working_days = await getWorkingDays(replacements);

    // Calculate advanced analytics for range views (month/year)
    let analytics = {};
    let processedStudents = [];
    if (month || year) {
      let trendData = [];

      if (month && year) {
        // 1a. Weekly Trends (for Monthly View)
        const weeklyTrends = await sequelize.query(
          `
          SELECT 
            EXTRACT(WEEK FROM date)::int as week,
            COUNT(*) FILTER (WHERE status = 'present')::int as present,
            COUNT(*) FILTER (WHERE status = 'absent')::int as absent
          FROM attendance
          WHERE ${whereClause} AND marked_by = :teacher_id
          GROUP BY week
          ORDER BY week ASC
          `,
          { replacements, type: QueryTypes.SELECT }
        );
        trendData = weeklyTrends.map(w => ({
          label: `Week ${w.week}`,
          percentage: (w.present + w.absent) > 0
            ? ((w.present / (w.present + w.absent)) * 100).toFixed(2)
            : "0.00"
        }));
        analytics.weekly_trends = trendData;
      } else if (year) {
        // 1b. Monthly Trends (for Yearly View)
        const monthlyTrends = await sequelize.query(
          `
          SELECT 
            EXTRACT(MONTH FROM date)::int as month_num,
            COUNT(*) FILTER (WHERE status = 'present')::int as present,
            COUNT(*) FILTER (WHERE status = 'absent')::int as absent
          FROM attendance
          WHERE ${whereClause} AND marked_by = :teacher_id
          GROUP BY month_num
          ORDER BY month_num ASC
          `,
          { replacements, type: QueryTypes.SELECT }
        );

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        trendData = monthlyTrends.map(m => ({
          label: monthNames[m.month_num - 1],
          percentage: (m.present + m.absent) > 0
            ? ((m.present / (m.present + m.absent)) * 100).toFixed(2)
            : "0.00"
        }));
        analytics.monthly_attendance_trend = trendData;
      }

      // 2. Process student list for Top/Bottom and Categorization
      processedStudents = studentList.map(s => {
        const total = (s.total_present || 0) + (s.total_absent || 0);
        const percentage = total > 0 ? ((s.total_present / total) * 100).toFixed(2) : "0.00";
        return { ...s, attendance_percentage: percentage };
      });

      const excellent = processedStudents.filter(s => parseFloat(s.attendance_percentage) > 95).length;
      const good = processedStudents.filter(s => parseFloat(s.attendance_percentage) >= 85 && parseFloat(s.attendance_percentage) <= 95).length;
      const needs_work = processedStudents.filter(s => parseFloat(s.attendance_percentage) < 85).length;

      analytics = {
        ...analytics,
        categorization: {
          excellent,
          good,
          needs_work
        },
        top_attendees: processedStudents
          .filter(s => parseFloat(s.attendance_percentage) > 0)
          .sort((a, b) => b.attendance_percentage - a.attendance_percentage)
          .slice(0, 5),
        needs_improvement: processedStudents
          .filter(s => parseFloat(s.attendance_percentage) < 85)
          .sort((a, b) => a.attendance_percentage - b.attendance_percentage)
          .slice(0, 5)
      };
    } else {
      // Daily view: map status to attendance_percentage for consistency
      processedStudents = studentList.map(s => ({
        ...s,
        attendance_percentage: s.status === 'present' ? "100.00" : "0.00"
      }));

      const excellent = processedStudents.filter(s => s.status === 'present').length;
      const good = 0;
      const needs_work = processedStudents.filter(s => s.status !== 'present').length;

      analytics.categorization = {
        excellent,
        good,
        needs_work
      };
    }

    res.json({
      success: true,
      filter: month && year ? { month, year } : (year ? { year } : { date: replacements.date }),
      summary: {
        total_students,
        total_working_days: working_days,
        total_present: present,
        total_absent: absent,
        average_attendance_percentage: total_students && working_days
          ? ((present / (total_students * working_days)) * 100).toFixed(2)
          : "0.00"
      },
      ...analytics,
      students: processedStudents
    });

  } catch (error) {
    console.error("Attendance Summary Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance summary"
    });
  }
};

// Helper to estimate working days for percentage calculation in ranges
async function getWorkingDays(replacements) {
  // Count distinct dates where attendance was marked for students in teacher's divisions
  const query = replacements.date
    ? `SELECT 1 as days`
    : `SELECT COUNT(DISTINCT a.date)::int as days 
       FROM attendance a
       JOIN student_forms sf ON a.student_id = sf.id
       WHERE sf.division_id IN (SELECT id FROM divisions WHERE teacher_id = :teacher_id)
         AND sf.school_id = :school_id
         AND ${replacements.month ? 'EXTRACT(MONTH FROM a.date) = :month AND' : ''} EXTRACT(YEAR FROM a.date) = :year`;

  const result = await sequelize.query(query, { replacements, type: QueryTypes.SELECT });
  return result[0]?.days || 1;
}
