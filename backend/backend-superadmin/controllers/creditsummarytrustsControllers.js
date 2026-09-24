const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");

// ---------------- ALL TRUSTS CREDIT SUMMARY (SUPER ADMIN) ----------------
exports.getAllTrustsCreditSummary = async (req, res) => {
  try {
    // 1️⃣ TOTAL REMAINING CREDIT (SOURCE OF TRUTH)
    const remainingResult = await sequelize.query(
      `
      SELECT COALESCE(SUM(credit), 0) AS total_remaining
      FROM trusts
      `,
      { type: QueryTypes.SELECT }
    );

    const totalRemaining = Number(remainingResult[0].total_remaining) || 0;

    // 2️⃣ TOTAL USED CREDIT (ALL TRUSTS)
    const usedResult = await sequelize.query(
      `
      SELECT COALESCE(SUM(amount), 0) AS total_used
      FROM trust_credit_transactions
      WHERE type = 'use'
      `,
      { type: QueryTypes.SELECT }
    );

    const totalUsed = Number(usedResult[0].total_used) || 0;

    // 3️⃣ TOTAL ALLOCATED (USED + REMAINING)
    const totalAllocated = totalRemaining + totalUsed;

    // 4️⃣ TOTAL IDS GENERATED ACROSS ALL TRUSTS
    const totalIdsResult = await sequelize.query(
      `
      SELECT COUNT(*) AS total_ids_generated
      FROM student_generated_ids
      `,
      { type: QueryTypes.SELECT }
    );

    const totalIdsGenerated = Number(totalIdsResult[0].total_ids_generated) || 0;

    return res.status(200).json({
      success: true,
      message: "📊 All trusts credit summary fetched successfully",
      data: {
        total_allocated: totalAllocated,
        total_used: totalUsed,
        total_remaining: totalRemaining,
        total_ids_generated: totalIdsGenerated
      }
    });

  } catch (error) {
    console.error("All Trusts Credit Summary Error:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "❌ Failed to fetch credit summary"
    });
  }
};
