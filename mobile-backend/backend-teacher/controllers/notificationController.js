const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");
const { sendPushToUsers } = require("../../utils/pushNotification");

function getAppBaseUrl(req) {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.replace(/\/$/, "");
  }
  if (req) {
    return `${req.protocol}://${req.get("host")}`;
  }
  return (process.env.MEDIA_STORAGE_URL || "").replace(/\/$/, "");
}

function normalizeMediaPath(filePath) {
  if (!filePath) return null;
  let normalized = String(filePath).replace(/\\/g, "/");
  const uploadsIndex = normalized.indexOf("uploads/");
  if (uploadsIndex >= 0) {
    normalized = normalized.substring(uploadsIndex);
  }
  return normalized.replace(/^\/+/, "");
}

function buildMediaUrl(storedPath, req) {
  const normalized = normalizeMediaPath(storedPath);
  if (!normalized) return null;
  const base = getAppBaseUrl(req);
  if (!base) return `/${normalized}`;
  return `${base}/${normalized}`;
}

/**
 * GET ALL NOTIFICATIONS (BY TEACHER)
 * Returns all notifications created by the authenticated teacher.
 */
exports.getNotifications = async (req, res) => {
    try {
        const teacher = req.teacher;

        if (!teacher || !teacher.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const notifications = await sequelize.query(
            `
            SELECT n.*, c.class_name
            FROM notifications n
            LEFT JOIN classes c ON n.class_id = c.id
            WHERE n.teacher_id = :teacher_id
            ORDER BY n.created_at DESC
            `,
            {
                replacements: { teacher_id: teacher.id },
                type: QueryTypes.SELECT
            }
        );

        const notificationsWithUrls = notifications.map((n) => ({
            ...n,
            media_url: buildMediaUrl(n.media_url, req)
        }));

        return res.json({
            success: true,
            count: notificationsWithUrls.length,
            notifications: notificationsWithUrls
        });

    } catch (error) {
        console.error("Get Notifications Error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * SEND NOTIFICATION
 * Creates a new notification for a specific class.
 */
exports.sendNotification = async (req, res) => {
    try {
        const teacher = req.teacher;
        const { class_id, message } = req.body;

        const media_url = req.file ? normalizeMediaPath(req.file.path) : null;
        const fullImageUrl = buildMediaUrl(media_url, req);

        if (!teacher || !teacher.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (!message) {
            return res.status(400).json({ success: false, message: "Message is required" });
        }

        // If class_id is "null" string or undefined, treat as null (school-wide if needed, or validate)
        const finalClassId = (class_id === "null" || class_id === "undefined" || class_id === "all" || !class_id) ? null : class_id;

        await sequelize.query(
            `
            INSERT INTO notifications (school_id, teacher_id, class_id, message, media_url, created_at, updated_at)
            VALUES (:school_id, :teacher_id, :class_id, :message, :media_url, NOW(), NOW())
            `,
            {
                replacements: {
                    school_id: teacher.school_id,
                    teacher_id: teacher.id,
                    class_id: finalClassId,
                    message,
                    media_url
                }
            }
        );
    
        // --- 🚀 Send Push Notification ---
        (async () => {
            try {
                // Fetch student IDs based on class_id or school_id
                let studentIds = [];
                if (finalClassId) {
                    const students = await sequelize.query(
                        `SELECT id FROM student_forms WHERE class_id = :class_id AND school_id = :school_id`,
                        { replacements: { class_id: finalClassId, school_id: teacher.school_id }, type: QueryTypes.SELECT }
                    );
                    studentIds = students.map(s => s.id);
                } else {
                    const students = await sequelize.query(
                        `SELECT id FROM student_forms WHERE school_id = :school_id`,
                        { replacements: { school_id: teacher.school_id }, type: QueryTypes.SELECT }
                    );
                    studentIds = students.map(s => s.id);
                }
    
                if (studentIds.length > 0) {
                    await sendPushToUsers(studentIds, 'student', {
                        title: "School Announcement 📢",
                        body: message,
                        imageUrl: fullImageUrl,
                        data: { 
                            type: "announcement", 
                            class_id: String(finalClassId || "all"),
                            media_url: media_url || ""
                        }
                    });
                }
            } catch (pErr) {
                console.error("Push Notification Logic Error:", pErr);
            }
        })();
        // ---------------------------------
    
        return res.json({
            success: true,
            message: "Notification sent successfully",
            media_url: fullImageUrl
        });

    } catch (error) {
        console.error("Send Notification Error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * UPDATE NOTIFICATION
 * Updates an existing notification's message or class.
 */
exports.updateNotification = async (req, res) => {
    try {
        const teacher = req.teacher;
        const { id } = req.params;
        const { message, class_id } = req.body;

        if (!teacher || !teacher.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // Check if notification belongs to the teacher
        const [notification] = await sequelize.query(
            `SELECT * FROM notifications WHERE id = :id AND teacher_id = :teacher_id`,
            {
                replacements: { id, teacher_id: teacher.id },
                type: QueryTypes.SELECT
            }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found or unauthorized" });
        }

        const media_url = req.file ? normalizeMediaPath(req.file.path) : undefined;

        await sequelize.query(
            `
            UPDATE notifications
            SET message = COALESCE(:message, message),
                class_id = COALESCE(:class_id, class_id),
                media_url = COALESCE(:media_url, media_url),
                updated_at = NOW()
            WHERE id = :id AND teacher_id = :teacher_id
            `,
            {
                replacements: {
                    message: message || null,
                    class_id: class_id || null,
                    media_url: media_url || null,
                    id,
                    teacher_id: teacher.id
                }
            }
        );

        return res.json({
            success: true,
            message: "Notification updated successfully"
        });

    } catch (error) {
        console.error("Update Notification Error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * DELETE NOTIFICATION
 */
exports.deleteNotification = async (req, res) => {
    try {
        const teacher = req.teacher;
        const { id } = req.params;

        if (!teacher || !teacher.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // Check if notification belongs to the teacher
        const [notification] = await sequelize.query(
            `SELECT * FROM notifications WHERE id = :id AND teacher_id = :teacher_id`,
            {
                replacements: { id, teacher_id: teacher.id },
                type: QueryTypes.SELECT
            }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found or unauthorized" });
        }

        await sequelize.query(
            `DELETE FROM notifications WHERE id = :id AND teacher_id = :teacher_id`,
            {
                replacements: { id, teacher_id: teacher.id }
            }
        );

        return res.json({
            success: true,
            message: "Notification deleted successfully"
        });

    } catch (error) {
        console.error("Delete Notification Error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
