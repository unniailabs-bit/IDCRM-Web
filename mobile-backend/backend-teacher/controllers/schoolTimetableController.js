const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");
const { sendPushToClass } = require("../../utils/pushNotification");

// ---------------- CREATE ----------------
exports.createSchoolTimetable = async (req, res) => {
    try {
        const teacher = req.teacher;
        const { title, class_id, division_id } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: "Timetable file is required" });
        }

        if (!title || !class_id || !division_id) {
            return res.status(400).json({ success: false, message: "title, class_id, and division_id are required" });
        }

        const media_url = `/uploads/school-timetables/${req.file.filename}`;

        const [result] = await sequelize.query(
            `INSERT INTO school_timetables 
            (school_id, class_id, division_id, title, media_url, status, is_deleted, created_at, updated_at)
            VALUES (:school_id, :class_id, :division_id, :title, :media_url, 'active', false, NOW(), NOW())
            RETURNING *`,
            {
                replacements: {
                    school_id: teacher.school_id,
                    class_id,
                    division_id,
                    title,
                    media_url
                },
                type: QueryTypes.INSERT
            }
        );

        res.status(201).json({
            success: true,
            message: "School timetable uploaded successfully",
            data: result[0]
        });

        // 🚀 Send Push Notification to Class
        (async () => {
            try {
                const payload = {
                    title: "New Timetable Uploaded",
                    body: `A new timetable '${title}' has been uploaded for your class.`,
                    data: { type: 'school_timetable', id: result[0].id }
                };
                await sendPushToClass(teacher.school_id, class_id, division_id, payload);
            } catch (err) {
                console.error("Failed to send push notification for school timetable", err);
            }
        })();

    } catch (error) {
        console.error("Create School Timetable Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ---------------- GET ALL (Teacher) ----------------
exports.getSchoolTimetables = async (req, res) => {
    try {
        const teacher = req.teacher;

        // Fetch timetables for the teacher's school that are not deleted
        const timetables = await sequelize.query(
            `SELECT st.*, c.class_name, d.division_name 
             FROM school_timetables st
             JOIN classes c ON c.id = st.class_id
             JOIN divisions d ON d.id = st.division_id
             WHERE st.school_id = :school_id AND st.is_deleted = false
             ORDER BY st.created_at DESC`,
            {
                replacements: { school_id: teacher.school_id },
                type: QueryTypes.SELECT
            }
        );

        res.json({ success: true, data: timetables });

    } catch (error) {
        console.error("Get School Timetables Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ---------------- UPDATE ----------------
exports.updateSchoolTimetable = async (req, res) => {
    try {
        const teacher = req.teacher;
        const { id } = req.params;
        const { title, status, class_id, division_id } = req.body;

        let media_url = undefined;
        if (req.file) {
            media_url = `/uploads/school-timetables/${req.file.filename}`;
        }

        const [result] = await sequelize.query(
            `UPDATE school_timetables SET
                title = COALESCE(:title, title),
                status = COALESCE(:status, status),
                class_id = COALESCE(:class_id, class_id),
                division_id = COALESCE(:division_id, division_id),
                media_url = COALESCE(:media_url, media_url),
                updated_at = NOW()
             WHERE id = :id AND school_id = :school_id AND is_deleted = false
             RETURNING *`,
            {
                replacements: {
                    id,
                    school_id: teacher.school_id,
                    title: title || null,
                    status: status || null,
                    class_id: class_id || null,
                    division_id: division_id || null,
                    media_url: media_url || null
                },
                type: QueryTypes.UPDATE
            }
        );

        if (result.length === 0) {
            return res.status(404).json({ success: false, message: "Timetable not found" });
        }

        res.json({
            success: true,
            message: "School timetable updated successfully",
            data: result[0]
        });

    } catch (error) {
        console.error("Update School Timetable Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ---------------- DELETE ----------------
exports.deleteSchoolTimetable = async (req, res) => {
    try {
        const teacher = req.teacher;
        const { id } = req.params;

        const [result] = await sequelize.query(
            `UPDATE school_timetables SET is_deleted = true, updated_at = NOW()
             WHERE id = :id AND school_id = :school_id AND is_deleted = false
             RETURNING id`,
            {
                replacements: { id, school_id: teacher.school_id },
                type: QueryTypes.UPDATE
            }
        );

        if (result.length === 0) {
            return res.status(404).json({ success: false, message: "Timetable not found" });
        }

        res.json({
            success: true,
            message: "School timetable deleted successfully"
        });

    } catch (error) {
        console.error("Delete School Timetable Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};
