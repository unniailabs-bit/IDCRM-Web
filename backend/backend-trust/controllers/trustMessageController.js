// backend-trust/controllers/trustMessageController.js
const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");

// ---------------- SEND MESSAGE ----------------
exports.sendMessage = async (req, res) => {
  try {
    // If JWT contains trust_id, use it instead of params
    const trust_id = parseInt(req.params.trust_id) || req.trust.id;
    let { credit_amount, message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "❌ Message cannot be empty",
      });
    }

    credit_amount = Number(credit_amount) || 0;

    await sequelize.query(
      `INSERT INTO trust_to_superadmin_messages 
       (trust_id, credit_amount, message, status, created_at, updated_at)
       VALUES (:trust_id, :credit_amount, :message, 'pending', NOW(), NOW())`,
      {
        replacements: { trust_id, credit_amount, message: message.trim() },
        type: QueryTypes.INSERT,
      }
    );

    return res.status(200).json({
      success: true,
      message: "✅ Message sent to super admin successfully",
      data: { trust_id, credit_amount, message: message.trim() },
    });
  } catch (error) {
    console.error("Send Message Error:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "❌ Failed to send message",
    });
  }
};

// ---------------- GET TRUST MESSAGES ----------------
exports.getTrustMessages = async (req, res) => {
  try {
    const trust_id = parseInt(req.params.trust_id) || req.trust.id;

    const messages = await sequelize.query(
      `SELECT id, trust_id, credit_amount, message, status, created_at, updated_at
       FROM trust_to_superadmin_messages
       WHERE trust_id = :trust_id
       ORDER BY created_at DESC`,
      { replacements: { trust_id }, type: QueryTypes.SELECT }
    );

    return res.status(200).json({
      success: true,
      message: "📌 Your messages fetched successfully",
      data: messages,
    });
  } catch (error) {
    console.error("Get Trust Messages Error:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "❌ Failed to fetch your messages",
    });
  }
};
