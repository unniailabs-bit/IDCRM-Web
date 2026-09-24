const sequelize = require('../../config/db');
const { QueryTypes } = require('sequelize');

// -----------------------------
// Individual Student Certificates
// -----------------------------
exports.getStudentCertificates = async (req, res) => {
  try {
    // ✅ Get logged-in student from middleware
    const student_id = req.user?.id;
    if (!student_id) {
      return res.status(401).json({ success: false, message: "Unauthorized: Student not found" });
    }

    const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;

    // ✅ Fetch student roll_number and school_name
    const [studentInfo] = await sequelize.query(
      `SELECT sf.roll_number, s.school_name
       FROM student_forms sf
       JOIN schools s ON s.id = sf.school_id
       WHERE sf.id = :student_id
       LIMIT 1`,
      {
        replacements: { student_id },
        type: QueryTypes.SELECT
      }
    );

    // ✅ Fetch all certificates for this student
    const certificates = await sequelize.query(
      `
      SELECT tc.*, c.class_name, d.division_name,
             EXTRACT(YEAR FROM tc.date_awarded) AS awarded_year
      FROM teacher_certificates tc
      JOIN classes c ON c.id = tc.class_id
      JOIN divisions d ON d.id = tc.division_id
      WHERE tc.awarded_to = :student_id
      ORDER BY tc.date_awarded DESC
      `,
      {
        replacements: { student_id },
        type: QueryTypes.SELECT
      }
    );

    // ✅ Map certificate image URLs & cast BIGINT IDs to Number
    const certificatesWithUrl = certificates.map(cert => ({
      ...cert,
      id: Number(cert.id),
      teacher_id: Number(cert.teacher_id),
      school_id: Number(cert.school_id),
      awarded_to: Number(cert.awarded_to),
      class_id: Number(cert.class_id),
      division_id: Number(cert.division_id),
      certificate_image: cert.certificate_image ? `${baseUrl}${cert.certificate_image}` : null
    }));

    // ✅ Group certificates by year
    const certificatesByYear = {};
    certificatesWithUrl.forEach(cert => {
      const year = cert.awarded_year;
      if (!certificatesByYear[year]) certificatesByYear[year] = [];
      certificatesByYear[year].push(cert);
    });

    // ✅ Latest year for stats
    const years = Object.keys(certificatesByYear).map(Number);
    const latestYear = years.length ? Math.max(...years) : new Date().getFullYear();

    // ✅ Count by category for latest year
    const certificateCounts = {};
    if (certificatesByYear[latestYear]) {
      certificatesByYear[latestYear].forEach(c => {
        certificateCounts[c.category] = (certificateCounts[c.category] || 0) + 1;
      });
    }

    // ✅ Send response
    return res.status(200).json({
      success: true,
      student_id,
      roll_number: studentInfo?.roll_number || null,
      school_name: studentInfo?.school_name || null,
      year: latestYear,
      total_certificates: certificatesByYear[latestYear]?.length || 0,
      certificate_counts: certificateCounts,
      certificates: certificatesByYear[latestYear] || []
    });

  } catch (error) {
    console.error("Get Student Certificates Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
