const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");

// ---------------- GET TRUST WISE STUDENT ID USAGE ----------------
exports.getTrustGeneratedIdsSummary = async (req, res) => {
  try {
    const trust_id = req.trust?.id || req.user?.trust_id;

    if (!trust_id) {
      return res.status(401).json({
        success: false,
        message: "❌ Trust not authenticated",
      });
    }

    // 1️⃣ Validate trust
    const trustCheck = await sequelize.query(
      `SELECT id FROM trusts WHERE id = :trust_id`,
      {
        replacements: { trust_id },
        type: QueryTypes.SELECT,
      }
    );

    if (!trustCheck.length) {
      return res.status(404).json({
        success: false,
        message: "❌ Trust not found",
      });
    }

    // 2️⃣ School + Class + Division wise summary
    const schoolSummary = await sequelize.query(
      `
      SELECT
        s.id AS school_id,
        s.school_name,

        sf.class_id,
        c.class_name,

        sf.division_id,
        d.division_name,

        COUNT(g.id) AS total_ids_generated,
        COALESCE(SUM(g.credits_deducted), 0) AS total_credits_deducted

      FROM schools s

      LEFT JOIN student_generated_ids g
        ON g.school_id = s.id

      LEFT JOIN student_forms sf
        ON sf.id = g.student_form_id

      LEFT JOIN classes c
        ON c.id = sf.class_id

      LEFT JOIN divisions d
        ON d.id = sf.division_id

      WHERE s.trust_id = :trust_id

      GROUP BY
        s.id,
        s.school_name,
        sf.class_id,
        c.class_name,
        sf.division_id,
        d.division_name

      ORDER BY s.id
      `,
      {
        replacements: { trust_id },
        type: QueryTypes.SELECT,
      }
    );

    // 3️⃣ Total IDs generated (trust-wise)
    const totalResult = await sequelize.query(
      `
      SELECT COUNT(g.id) AS total_ids_generated
      FROM schools s
      LEFT JOIN student_generated_ids g
        ON g.school_id = s.id
      WHERE s.trust_id = :trust_id
      `,
      {
        replacements: { trust_id },
        type: QueryTypes.SELECT,
      }
    );

    const totalIdsGenerated = Number(totalResult[0].total_ids_generated);

    // 4️⃣ Final response
    return res.status(200).json({
      success: true,
      message: "✅ Trust-wise student ID summary fetched successfully",
      data: {
        school_summary: schoolSummary,
        total_ids_generated: totalIdsGenerated,
      },
    });

  } catch (error) {
    console.error("Trust Generated IDs Summary Error:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "❌ Failed to fetch trust summary",
      error: error.message,
    });
  }
};
