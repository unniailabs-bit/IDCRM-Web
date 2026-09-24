const admin = require("../config/firebase");
const sequelize = require("../config/db");
const { QueryTypes } = require("sequelize");

/**
 * Send a push notification to specific users
 * @param {Array} userIds - List of user IDs
 * @param {String} userType - 'teacher' or 'student'
 * @param {Object} payload - Notification payload { title, body, data }
 */
const sendPushToUsers = async (userIds, userType, payload) => {
    try {
        if (!admin.apps.length) {
            console.warn("⚠️ Firebase Admin SDK not initialized. Skipping push notification.");
            return;
        }

        if (!userIds || userIds.length === 0) return;

        // Fetch tokens for these users
        const tokensRecords = await sequelize.query(
            `SELECT fcm_token FROM fcm_tokens WHERE user_id IN (:userIds) AND user_type = :userType`,
            {
                replacements: { userIds, userType },
                type: QueryTypes.SELECT
            }
        );

        const tokens = tokensRecords.map(r => r.fcm_token);

        if (tokens.length === 0) {
            console.log(`ℹ️ No FCM tokens found for ${userType}s: ${userIds.join(', ')}`);
            return;
        }

        const message = {
            notification: {
                title: payload.title,
                body: payload.body,
            },
            data: payload.data || {},
            tokens: tokens,
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`✅ Successfully sent ${response.successCount} messages; ${response.failureCount} failed.`);

    } catch (error) {
        console.error("❌ Send Push Notification Error:", error);
    }
};

module.exports = { sendPushToUsers };
