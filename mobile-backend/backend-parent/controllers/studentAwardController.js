const sequelize = require('../../config/db');
const { QueryTypes } = require('sequelize');

// -----------------------------
// Individual Student Awards
// -----------------------------
exports.getStudentAwards = async (req, res) => {
  try {
    // ✅ Get logged-in student from middleware
    const student_id = req.user?.id || req.student?.id;
    if (!student_id) {
      return res.status(401).json({ success: false, message: "Unauthorized: Student not found" });
    }

    const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;

    // ✅ Fetch school_name for this student
    const [studentInfo] = await sequelize.query(
      `SELECT s.school_name
       FROM student_forms sf
       JOIN schools s ON s.id = sf.school_id
       WHERE sf.id = :student_id
       LIMIT 1`,
      {
        replacements: { student_id },
        type: QueryTypes.SELECT
      }
    );

    // ✅ Fetch all awards for this student
    const awards = await sequelize.query(
      `
      SELECT ta.*, sf.first_name AS student_first_name, sf.last_name AS student_last_name
           , c.class_name, d.division_name
           , EXTRACT(YEAR FROM ta.date_awarded) AS awarded_year
      FROM teacher_awards ta
      JOIN student_forms sf ON sf.id = ta.awarded_to
      JOIN classes c ON c.id = sf.class_id
      JOIN divisions d ON d.id = sf.division_id
      WHERE ta.awarded_to = :student_id
      ORDER BY ta.date_awarded DESC
      `,
      {
        replacements: { student_id },
        type: QueryTypes.SELECT
      }
    );

    // ✅ Map award image URLs
    const awardsWithUrl = awards.map(award => ({
      ...award,
      teacher_id: Number(award.teacher_id),
      award_image: award.award_image ? `${baseUrl}${award.award_image}` : null
    }));

    // ✅ Group awards by year
    const awardsByYear = {};
    awardsWithUrl.forEach(award => {
      const year = award.awarded_year;
      if (!awardsByYear[year]) awardsByYear[year] = [];
      awardsByYear[year].push(award);
    });

    // ✅ Latest year for stats
    const years = Object.keys(awardsByYear).map(Number);
    const latestYear = years.length ? Math.max(...years) : new Date().getFullYear();

    // ✅ Count by category for latest year
    const awardCounts = {};
    if (awardsByYear[latestYear]) {
      awardsByYear[latestYear].forEach(a => {
        awardCounts[a.category] = (awardCounts[a.category] || 0) + 1;
      });
    }

    // ✅ Send response
    return res.status(200).json({
      success: true,
      student_id,
      school_name: studentInfo?.school_name || null,
      year: latestYear,
      total_awards: awardsByYear[latestYear]?.length || 0,
      award_counts: awardCounts,
      awards: awardsByYear[latestYear] || []
    });

  } catch (error) {
    console.error("Get Student Awards Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
