const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");

// ---------------- GET TRUST CREDIT SUMMARY ----------------
exports.getTrustCreditSummary = async (req, res) => {
  try {
    const email = req.trust?.email || req.user?.email;

    if (!email) {
      return res.status(401).json({
        success: false,
        message: "❌ Trust not authenticated",
      });
    }

    // 1️⃣ Fetch trust info
    const trustData = await sequelize.query(
      `SELECT id, credit, allot_ids FROM trusts WHERE email = :email`,
      { replacements: { email }, type: QueryTypes.SELECT }
    );

    if (!trustData.length) {
      return res.status(404).json({
        success: false,
        message: "❌ Trust not found",
      });
    }

    const trust_id = trustData[0].id;
    const current_credit = Number(trustData[0].credit) || 0;
    const allot_ids = Number(trustData[0].allot_ids) || 0;

    // 2️⃣ Credit summary (add/edit/deduct/use)
    const creditSummary = await sequelize.query(
      `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'add' THEN amount END), 0) AS total_received,
        COALESCE(SUM(CASE WHEN type = 'edit' THEN amount END), 0) AS total_edited,
        COALESCE(SUM(CASE WHEN type = 'deduct' THEN amount END), 0) AS total_deducted,
        COALESCE(SUM(CASE WHEN type = 'use' THEN amount END), 0) AS total_used
      FROM trust_credit_transactions
      WHERE trust_id = :trust_id
      `,
      { replacements: { trust_id }, type: QueryTypes.SELECT }
    );

    const total_received_from_transactions = Number(creditSummary[0].total_received);
    const total_edited = Number(creditSummary[0].total_edited);
    const total_deducted = Number(creditSummary[0].total_deducted);
    const total_used = Number(creditSummary[0].total_used);

    // 3️⃣ School-wise usage
    const schoolUsage = await sequelize.query(
      `
      SELECT 
        school_id,
        COALESCE(SUM(amount), 0) AS total_used
      FROM trust_credit_transactions
      WHERE trust_id = :trust_id AND type = 'use'
      GROUP BY school_id
      `,
      { replacements: { trust_id }, type: QueryTypes.SELECT }
    );

    // Calculate robust summary values
    // Net Allocation = What is left + What was spent
    const total_credits_allocated = current_credit + total_used;
    // Gross Allocation = Net Allocation + What was manually deducted
    const total_received = total_credits_allocated + total_deducted;

    return res.status(200).json({
      success: true,
      message: "✅ Trust credit summary fetched successfully",
      data: {
        trust_id,
        current_credit: current_credit,                      // Actual balance from DB
        total_credits_allocated: total_credits_allocated,    // Net credits received and available (spent or remaining)
        total_received: total_received,                      // Gross credits ever allocated (including deducted)
        total_edited: total_edited,
        total_deducted: total_deducted,
        total_used: total_used,
        remaining_credit: current_credit,                    // Same as actual balance
        school_usage: schoolUsage                            // school-wise usage
      },
    });
  } catch (error) {
    console.error("Get Trust Credit Summary Error:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "❌ Failed to fetch credit summary",
    });
  }
};



