const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");
const { sendPushToUsers } = require("../../utils/pushNotification");

// -------------------- Create Notification --------------------
exports.createNotification = async (req, res) => {
    try {
        const school_id = req.user?.school_id;
        const { message } = req.body;
        const media_url = req.file ? `uploads/notifications/${req.file.filename}` : null;

        if (!school_id) {
            return res.status(401).json({ success: false, message: "Unauthorized: School not found." });
        }

        if (!message) {
            return res.status(400).json({ success: false, message: "Message is required." });
        }

        const query = `
      INSERT INTO notifications (school_id, message, media_url, is_read, created_at, updated_at)
      VALUES (:school_id, :message, :media_url, false, NOW(), NOW())
      RETURNING *;
    `;

        const [notification] = await sequelize.query(query, {
            replacements: { school_id, message, media_url },
            type: QueryTypes.INSERT,
        });

        // --- 🚀 Send Push Notification to all students of this school ---
        (async () => {
            try {
                // Get all student IDs for this school
                const students = await sequelize.query(
                    `SELECT id FROM student_forms WHERE school_id = :school_id AND status = 'approved'`,
                    {
                        replacements: { school_id },
                        type: QueryTypes.SELECT
                    }
                );

                const studentIds = students.map(s => s.id);

                if (studentIds.length > 0) {
                    await sendPushToUsers(studentIds, 'student', {
                        title: "School Announcement 📢",
                        body: message.length > 50 ? message.substring(0, 47) + "..." : message,
                        data: { type: "notice", id: String(notification[0].id) }
                    });
                }
            } catch (pErr) {
                console.error("Push Notification Logic Error (School Notice):", pErr);
            }
        })();
        // ---------------------------------------------------------------

        res.status(201).json({
            success: true,
            message: "Notification created successfully",
            data: notification[0],
        });
    } catch (error) {
        console.error("Create Notification Error:", error);
        res.status(500).json({ success: false, message: "Server error while creating notification" });
    }
};

// -------------------- Get Notifications --------------------
exports.getNotifications = async (req, res) => {
    try {
        const school_id = req.user?.school_id;

        if (!school_id) {
            return res.status(401).json({ success: false, message: "Unauthorized: School not found." });
        }

        const notifications = await sequelize.query(
            `SELECT * FROM notifications 
       WHERE school_id = :school_id
       ORDER BY created_at DESC`,
            { replacements: { school_id }, type: QueryTypes.SELECT }
        );

        res.status(200).json({
            success: true,
            message: "Notifications fetched successfully",
            data: notifications,
        });
    } catch (error) {
        console.error("Get Notifications Error:", error);
        res.status(500).json({ success: false, message: "Server error while fetching notifications" });
    }
};

// -------------------- Update Notification --------------------
exports.updateNotification = async (req, res) => {
    const fs = require("fs");
    const path = require("path");

    try {
        const school_id = req.user?.school_id;
        const { id } = req.params;
        const { message, removeMedia } = req.body;
        const newMediaFile = req.file;

        if (!school_id) {
            return res.status(401).json({ success: false, message: "Unauthorized." });
        }

        // Get existing notification to check for old media
        const [existing] = await sequelize.query(
            `SELECT * FROM notifications WHERE id = :id AND school_id = :school_id`,
            { replacements: { id, school_id }, type: QueryTypes.SELECT }
        );
        if (!existing) {
            return res.status(404).json({ success: false, message: "Notification not found or unauthorized." });
        }

        // Handle media file updates
        let media_url = existing.media_url;

        // If removeMedia flag is set, delete old file and set media_url to null
        if (removeMedia === 'true' || removeMedia === true) {
            if (existing.media_url) {
                const oldFilePath = path.join(__dirname, "../../", existing.media_url);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }
            media_url = null;
        }

        // If new file is uploaded, delete old file and use new one
        if (newMediaFile) {
            if (existing.media_url) {
                const oldFilePath = path.join(__dirname, "../../", existing.media_url);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }
            media_url = `uploads/notifications/${newMediaFile.filename}`;
        }

        // Build update query dynamically
        const updates = [];
        const replacements = { id, school_id };

        if (message !== undefined) {
            updates.push("message = :message");
            replacements.message = message;
        }

        if (media_url !== existing.media_url) {
            updates.push("media_url = :media_url");
            replacements.media_url = media_url;
        }

        updates.push("updated_at = NOW()");

        if (updates.length === 1) {
            return res.status(400).json({ success: false, message: "No fields to update." });
        }

        const query = `
            UPDATE notifications 
            SET ${updates.join(", ")}
            WHERE id = :id AND school_id = :school_id 
            RETURNING *
        `;

        const [updated] = await sequelize.query(query, {
            replacements,
            type: QueryTypes.UPDATE,
        });

        if (!updated || updated.length === 0) {
            return res.status(404).json({ success: false, message: "Notification not found or unauthorized." });
        }

        res.status(200).json({
            success: true,
            message: "Notification updated successfully",
            data: updated[0],
        });
    } catch (error) {
        console.error("Update Notification Error:", error);
        res.status(500).json({ success: false, message: "Server error while updating notification" });
    }
};

// -------------------- Delete Notification --------------------
exports.deleteNotification = async (req, res) => {
    const fs = require("fs");
    const path = require("path");

    try {
        const school_id = req.user?.school_id;
        const { id } = req.params;

        if (!school_id) {
            return res.status(401).json({ success: false, message: "Unauthorized." });
        }

        // Get notification to check for media file
        const [notification] = await sequelize.query(
            `SELECT * FROM notifications WHERE id = :id AND school_id = :school_id`,
            { replacements: { id, school_id }, type: QueryTypes.SELECT }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found or unauthorized." });
        }

        // Delete media file if exists
        if (notification.media_url) {
            const filePath = path.join(__dirname, "../../", notification.media_url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Delete notification from database
        await sequelize.query(
            `DELETE FROM notifications WHERE id = :id AND school_id = :school_id`,
            { replacements: { id, school_id }, type: QueryTypes.DELETE }
        );

        res.status(200).json({
            success: true,
            message: "Notification deleted successfully",
        });
    } catch (error) {
        console.error("Delete Notification Error:", error);
        res.status(500).json({ success: false, message: "Server error while deleting notification" });
    }
};
