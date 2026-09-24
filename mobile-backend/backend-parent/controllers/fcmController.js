const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");
/**
 * Register or update FCM token for a parent/student
 */
exports.registerToken = async (req, res) => {
    try {
        const student = req.parent; // In parentAuth, req.parent is the student_forms record
        const { fcm_token, device_info } = req.body;

        if (!student || !student.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (!fcm_token) {
            return res.status(400).json({ success: false, message: "FCM token is required" });
        }

        // Use UPSERT logic for the fcm_tokens table
        await sequelize.query(
            `
            INSERT INTO fcm_tokens (user_id, user_type, fcm_token, device_info, updated_at)
            VALUES (:user_id, :user_type, :fcm_token, :device_info, NOW())
            ON CONFLICT (fcm_token) 
            DO UPDATE SET 
                user_id = EXCLUDED.user_id,
                user_type = EXCLUDED.user_type,
                device_info = COALESCE(EXCLUDED.device_info, fcm_tokens.device_info),
                updated_at = NOW()
            `,
            {
                replacements: {
                    user_id: student.id,
                    user_type: 'student',
                    fcm_token,
                    device_info: device_info || null
                }
            }
        );

        return res.json({
            success: true,
            message: "FCM Token registered successfully"
        });

    } catch (error) {
        console.error("Register FCM Token Error (Parent):", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
