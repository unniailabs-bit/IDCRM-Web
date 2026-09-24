const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");

// =======================================
// GET - Student Events (Class + Division)
// =======================================
exports.getStudentEvents = async (req, res) => {
  try {
    /**
     * 🔐 Logged-in student
     * req.parent comes from parentAuth middleware
     */
    const student = req.parent;

    if (!student || !student.class_id || !student.division_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Student information missing"
      });
    }

    const classId = student.class_id;
    const divisionId = student.division_id;

    /**
     * 🌐 Base URL for images
     */
    const baseUrl =
      process.env.BACKEND_URL ||
      `${req.protocol}://${req.get("host")}`;

    /**
     * 📸 Fetch Events with Gallery Photos
     */
    const events = await sequelize.query(
      `
      SELECT 
        e.id AS event_id,
        e.event_title,
        e.event_category,
        e.event_date,
        e.class_id,
        e.division_id,
        e.created_at,

        COALESCE(
          json_agg(
            json_build_object(
              'photo_id', egp.id,
              'photo_url', 
                CASE 
                  WHEN egp.photo_url IS NOT NULL 
                  THEN CONCAT(:baseUrl, egp.photo_url)
                  ELSE NULL
                END,
              'caption', egp.caption
            )
          ) FILTER (WHERE egp.id IS NOT NULL),
          '[]'
        ) AS photos

      FROM events e
      LEFT JOIN event_gallery_photos egp 
        ON egp.event_id = e.id

      WHERE 
        e.class_id = :classId
        AND e.division_id = :divisionId
        AND e.is_active = true

      GROUP BY e.id
      ORDER BY e.event_date DESC
      `,
      {
        replacements: {
          classId,
          divisionId,
          baseUrl
        },
        type: QueryTypes.SELECT
      }
    );

    /**
     * ✅ Response
     */
    return res.status(200).json({
      success: true,
      message: "Student events fetched successfully",
      count: events.length,
      data: events
    });

  } catch (error) {
    console.error("Get Student Events Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};
