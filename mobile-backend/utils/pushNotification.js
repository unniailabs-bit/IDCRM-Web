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

        const tokens = tokensRecords.map(r => r.fcm_token.trim());

        if (tokens.length === 0) {
            console.log(`ℹ️ No FCM tokens found for ${userType}s: ${userIds.length} users checked.`);
            return;
        }

        // --- 🚀 FCM Data Payload MUST be all strings ---
        const stringifiedData = {};
        if (payload.data) {
            Object.keys(payload.data).forEach(key => {
                stringifiedData[key] = String(payload.data[key]);
            });
        }

        const message = {
            notification: {
                title: payload.title,
                body: payload.body,
                image: payload.imageUrl || undefined,
            },
            data: stringifiedData,
            tokens: tokens,
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`✅ Successfully sent ${response.successCount} messages; ${response.failureCount} failed.`);

        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                }
            });
            console.log("❌ Failed tokens count:", failedTokens.length);
        }

    } catch (error) {
        console.error("❌ Send Push Notification Error:", error);
    }
};

/**
 * Send a push notification to all students in a specific class and division
 * @param {Number} schoolId 
 * @param {Number} classId 
 * @param {Number} divisionId 
 * @param {Object} payload 
 */
const sendPushToClass = async (schoolId, classId, divisionId, payload) => {
    try {
        // Fetch all student IDs in this class/division
        const students = await sequelize.query(
            `SELECT id FROM student_forms WHERE school_id = :schoolId AND class_id = :classId AND division_id = :divisionId`,
            {
                replacements: { schoolId, classId, divisionId },
                type: QueryTypes.SELECT
            }
        );

        const studentIds = students.map(s => s.id);
        if (studentIds.length > 0) {
            await sendPushToUsers(studentIds, 'student', payload);
        }
    } catch (error) {
        console.error("❌ Send Push To Class Error:", error);
    }
};

module.exports = { sendPushToUsers, sendPushToClass };
