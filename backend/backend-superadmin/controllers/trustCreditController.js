const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");

// ---------------- ADD CREDIT ----------------
exports.addCredit = async (req, res) => {
  try {
    const trust_id = parseInt(req.params.trust_id);
    const { credit, reason } = req.body;
    const adminId = req.user?.id || 1;

    const trust = await sequelize.query(
      "SELECT * FROM trusts WHERE id = :trust_id",
      { replacements: { trust_id }, type: QueryTypes.SELECT }
    );

    if (!trust || trust.length === 0) {
      return res.status(404).json({ success: false, message: "❌ Trust not found" });
    }

    const oldCredit = trust[0].credit || 0;
    const newCredit = oldCredit + Number(credit);

    if (newCredit < 0) {
      return res.status(400).json({ success: false, message: "❌ Insufficient credits. Balance cannot be negative." });
    }

    await sequelize.query(
      "UPDATE trusts SET credit = :newCredit, credit_reason = :reason WHERE id = :trust_id",
      {
        replacements: { newCredit, reason, trust_id },
        type: QueryTypes.UPDATE,
      }
    );

    await sequelize.query(
      `INSERT INTO trust_credit_transactions
       (trust_id, amount, previous_credit, new_credit, reason, type, created_by, "createdAt", "updatedAt")
       VALUES (:trust_id, :amount, :prev, :newC, :reason, 'add', :adminId, NOW(), NOW())`,
      {
        replacements: {
          trust_id,
          amount: Number(credit),
          prev: oldCredit,
          newC: newCredit,
          reason,
          adminId,
        },
        type: QueryTypes.INSERT,
      }
    );

    return res.status(200).json({
      success: true,
      message: "✅ Credit added successfully",
      data: { trust_id, newCredit, reason },
    });

  } catch (error) {
    console.log("Add Credit Error:", error);
    return res.status(500).json({ success: false, message: "❌ Failed to add credit" });
  }
};

// ---------------- DEDUCT CREDIT ----------------
exports.deductCredit = async (req, res) => {
  try {
    const trust_id = parseInt(req.params.trust_id);
    const { credit, reason } = req.body;
    const adminId = req.user?.id || 1;

    if (!credit || isNaN(credit) || Number(credit) <= 0) {
      return res.status(400).json({ success: false, message: "❌ Please provide a valid credit amount to deduct." });
    }

    const trust = await sequelize.query(
      "SELECT * FROM trusts WHERE id = :trust_id",
      { replacements: { trust_id }, type: QueryTypes.SELECT }
    );

    if (!trust || trust.length === 0) {
      return res.status(404).json({ success: false, message: "❌ Trust not found" });
    }

    const oldCredit = trust[0].credit || 0;
    const amountToDeduct = Number(credit);
    const newCredit = oldCredit - amountToDeduct;

    if (newCredit < 0) {
      return res.status(400).json({ success: false, message: "❌ Insufficient credits. Balance cannot be negative." });
    }

    await sequelize.query(
      "UPDATE trusts SET credit = :newCredit, credit_reason = :reason WHERE id = :trust_id",
      {
        replacements: { newCredit, reason, trust_id },
        type: QueryTypes.UPDATE,
      }
    );

    await sequelize.query(
      `INSERT INTO trust_credit_transactions
       (trust_id, amount, previous_credit, new_credit, reason, type, created_by, "createdAt", "updatedAt")
       VALUES (:trust_id, :amount, :prev, :newC, :reason, 'deduct', :adminId, NOW(), NOW())`,
      {
        replacements: {
          trust_id,
          amount: amountToDeduct,
          prev: oldCredit,
          newC: newCredit,
          reason,
          adminId,
        },
        type: QueryTypes.INSERT,
      }
    );

    return res.status(200).json({
      success: true,
      message: "✅ Credit deducted successfully",
      data: { trust_id, newCredit, reason },
    });

  } catch (error) {
    console.log("Deduct Credit Error:", error);
    return res.status(500).json({ success: false, message: "❌ Failed to deduct credit" });
  }
};

// ---------------- EDIT CREDIT ----------------
exports.editCredit = async (req, res) => {
  try {
    const trust_id = parseInt(req.params.trust_id);
    const { credit, reason } = req.body;
    const adminId = req.user?.id || 1;

    const trust = await sequelize.query(
      "SELECT * FROM trusts WHERE id = :trust_id",
      { replacements: { trust_id }, type: QueryTypes.SELECT }
    );

    if (!trust || trust.length === 0) {
      return res.status(404).json({ success: false, message: "❌ Trust not found" });
    }

    const oldCredit = trust[0].credit || 0;
    const newCredit = Number(credit);

    if (newCredit < 0) {
      return res.status(400).json({ success: false, message: "❌ Credit value cannot be negative." });
    }

    await sequelize.query(
      "UPDATE trusts SET credit = :newCredit, credit_reason = :reason WHERE id = :trust_id",
      {
        replacements: { newCredit, reason, trust_id },
        type: QueryTypes.UPDATE,
      }
    );

    await sequelize.query(
      `INSERT INTO trust_credit_transactions
       (trust_id, amount, previous_credit, new_credit, reason, type, created_by, "createdAt", "updatedAt")
       VALUES (:trust_id, :amount, :prev, :newC, :reason, 'edit', :adminId, NOW(), NOW())`,
      {
        replacements: {
          trust_id,
          amount: newCredit,
          prev: oldCredit,
          newC: newCredit,
          reason,
          adminId,
        },
        type: QueryTypes.INSERT,
      }
    );

    return res.status(200).json({
      success: true,
      message: "✏️ Credit edited successfully",
      data: { trust_id, newCredit, reason },
    });

  } catch (error) {
    console.log("Edit Credit Error:", error);
    return res.status(500).json({ success: false, message: "❌ Failed to update credit" });
  }
};

// ---------------- GET CURRENT CREDIT (FINAL SUMMARY) ----------------
exports.getCredit = async (req, res) => {
  try {
    const data = await sequelize.query(
      `
      SELECT
        tr.id                                   AS "trustId",
        tr.trust_name                          AS "trustName",
        tr.credit                              AS "remaining",

        COALESCE(
          SUM(
            CASE 
              WHEN tct.type = 'use' THEN tct.amount 
              ELSE 0 
            END
          ), 
          0
        )                                       AS "used",

        (
          tr.credit +
          COALESCE(
            SUM(
              CASE 
                WHEN tct.type = 'use' THEN tct.amount 
                ELSE 0 
              END
            ), 
            0
          )
        )                                       AS "totalCredits",

        MAX(
          CASE 
            WHEN tct.type IN ('add', 'edit') 
            THEN tct."createdAt"
            ELSE NULL
          END
        )                                       AS "lastUpdatedAt"

      FROM trusts tr
      LEFT JOIN trust_credit_transactions tct 
        ON tct.trust_id = tr.id

      GROUP BY tr.id, tr.trust_name, tr.credit
      ORDER BY tr.id DESC
      `,
      { type: QueryTypes.SELECT }
    );

    return res.status(200).json({
      success: true,
      message: "📌 Trust credit summary fetched successfully",
      data,
    });

  } catch (error) {
    console.log("Get Credit Error:", error);
    return res.status(500).json({
      success: false,
      message: "❌ Failed to fetch credit summary",
    });
  }
};


// ---------------- GET CREDIT HISTORY (SUPER ADMIN ONLY: ADD & EDIT) ----------------
exports.getCreditHistory = async (req, res) => {
  try {
    const history = await sequelize.query(
      `
      SELECT
        tct."createdAt"       AS "dateTime",
        tr.trust_name         AS "trustName",
        tct.type              AS "type",
        tct.amount            AS "credits",
        tct.reason            AS "reason",
        'Super Admin'         AS "performedBy"
      FROM trust_credit_transactions tct
      INNER JOIN trusts tr 
        ON tr.id = tct.trust_id
      WHERE tct.type IN ('add', 'edit', 'deduct')
      ORDER BY tct."createdAt" DESC
      `,
      { type: QueryTypes.SELECT }
    );

    return res.status(200).json({
      success: true,
      message: "📜 Super Admin credit history fetched successfully",
      data: history,
    });

  } catch (error) {
    console.log("Credit History Error:", error);
    return res.status(500).json({
      success: false,
      message: "❌ Failed to fetch credit history",
    });
  }
};

// ---------------- GET TRUST MESSAGES FOR SUPER ADMIN ----------------
exports.getTrustMessagesForSuperAdmin = async (req, res) => {
  try {
    const trust_id = req.query.trust_id ? parseInt(req.query.trust_id) : null;
    const status = req.query.status || "pending"; // Default to 'pending' as requested

    let query = `
      SELECT
        ttsm.id,
        ttsm.trust_id,
        tr.trust_name,
        ttsm.credit_amount,
        ttsm.message,
        ttsm.status,
        ttsm.created_at
      FROM trust_to_superadmin_messages ttsm
      INNER JOIN trusts tr ON tr.id = ttsm.trust_id
    `;

    const replacements = {};
    const whereConditions = [];

    if (trust_id) {
      whereConditions.push("ttsm.trust_id = :trust_id");
      replacements.trust_id = trust_id;
    }

    if (status) {
      whereConditions.push("ttsm.status = :status");
      replacements.status = status;
    }

    if (whereConditions.length > 0) {
      query += " WHERE " + whereConditions.join(" AND ");
    }

    query += " ORDER BY ttsm.created_at DESC";

    const messages = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });

    return res.status(200).json({
      success: true,
      message: "📌 Trust messages fetched successfully",
      data: messages,
    });

  } catch (error) {
    console.log("Get Trust Messages Error:", error);
    return res.status(500).json({
      success: false,
      message: "❌ Failed to fetch trust messages",
    });
  }
};

// ---------------- UPDATE TRUST MESSAGE STATUS (APPROVE/REJECT) ----------------
exports.updateTrustMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Approved' or 'Rejected'

    if (!['Approved', 'Rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "❌ Invalid status. Use 'Approved', 'Rejected', or 'pending'",
      });
    }

    const [updated] = await sequelize.query(
      `UPDATE trust_to_superadmin_messages 
       SET status = :status, updated_at = NOW() 
       WHERE id = :id 
       RETURNING *`,
      {
        replacements: { id, status },
        type: QueryTypes.UPDATE,
      }
    );

    if (!updated || updated.length === 0) {
      return res.status(404).json({
        success: false,
        message: "❌ Message not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `✅ Message status updated to ${status}`,
      data: updated[0],
    });

  } catch (error) {
    console.log("Update Trust Message Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "❌ Failed to update message status",
    });
  }
};
