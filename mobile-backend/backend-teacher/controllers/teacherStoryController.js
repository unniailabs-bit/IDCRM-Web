const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");
const path = require("path");
const fs = require("fs");

/**
 * UPLOAD STORY (Teacher)
 * Handles text, image, and video stories
 */
exports.uploadStory = async (req, res) => {
    try {
        const teacher = req.teacher;
        if (!teacher || !teacher.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // Parse data from req.body and normalize
        let { class_id, division_id, story_type, category, story_content, caption } = req.body;

        story_type = story_type?.toLowerCase().trim();
        category = category?.trim();

        // Validate required fields
        if (class_id === undefined || division_id === undefined || !story_type || !category) {
            return res.status(400).json({
                success: false,
                message: "class_id, division_id, story_type and category are required"
            });
        }

        const validTypes = ["text", "image", "video"];
        if (!validTypes.includes(story_type)) {
            return res.status(400).json({ success: false, message: "Invalid story_type. Must be text, image, or video." });
        }

        const validCategories = ["Announcement", "Achievement", "Sports Event", "Cultural Event", "Birthday", "Festival"];
        if (!validCategories.some(c => c.toLowerCase() === category.toLowerCase())) {
            return res.status(400).json({ success: false, message: "Invalid category" });
        }

        // Text story requires story_content
        if (story_type === "text" && (!story_content || !story_content.trim())) {
            return res.status(400).json({ success: false, message: "story_content is required for text stories" });
        }

        // Image/Video story requires file upload
        let media_url = null;
        if (story_type === "image" || story_type === "video") {
            if (!req.file) {
                return res.status(400).json({ success: false, message: "File upload is required for image/video stories" });
            }

            // Path to the file already saved by multer
            media_url = `/uploads/stories/${req.file.filename}`;
        }

        // Insert into DB
        const result = await sequelize.query(
            `
            INSERT INTO teacher_stories
            (teacher_id, school_id, class_id, division_id, story_type, category, story_content, caption, media_url)
            VALUES
            (:teacher_id, :school_id, :class_id, :division_id, :story_type, :category, :story_content, :caption, :media_url)
            RETURNING *
            `,
            {
                replacements: {
                    teacher_id: teacher.id,
                    school_id: teacher.school_id,
                    class_id,
                    division_id,
                    story_type,
                    category,
                    story_content: story_content || null,
                    caption: caption || null,
                    media_url
                },
                type: QueryTypes.INSERT
            }
        );

        return res.json({
            success: true,
            message: "Story uploaded successfully",
            story: result[0]
        });

    } catch (error) {
        console.error("Upload Story Error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * GET ALL STORIES UPLOADED BY TEACHER
 */
exports.getTeacherStories = async (req, res) => {
    try {
        const teacher = req.teacher;
        if (!teacher || !teacher.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const stories = await sequelize.query(
            `
            SELECT *
            FROM teacher_stories
            WHERE teacher_id = :teacher_id
            ORDER BY created_at DESC
            `,
            {
                replacements: { teacher_id: teacher.id },
                type: QueryTypes.SELECT
            }
        );

        const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
        const storiesWithUrls = stories.map((s) => ({
            ...s,
            media_url: s.media_url ? `${baseUrl}${s.media_url}` : null
        }));

        return res.json({
            success: true,
            count: storiesWithUrls.length,
            stories: storiesWithUrls
        });

    } catch (error) {
        console.error("Get Teacher Stories Error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * DELETE STORY (Teacher)
 */
exports.deleteStory = async (req, res) => {
    try {
        const teacher = req.teacher;
        const { id } = req.params;

        if (!teacher || !teacher.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const [story] = await sequelize.query(
            `SELECT * FROM teacher_stories WHERE id = :id AND teacher_id = :teacher_id`,
            {
                replacements: { id, teacher_id: teacher.id },
                type: QueryTypes.SELECT
            }
        );

        if (!story) {
            return res.status(404).json({ success: false, message: "Story not found or unauthorized" });
        }

        if (story.media_url) {
            const filePath = path.join(__dirname, "..", story.media_url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await sequelize.query(
            `DELETE FROM teacher_stories WHERE id = :id AND teacher_id = :teacher_id`,
            {
                replacements: { id, teacher_id: teacher.id },
                type: QueryTypes.DELETE
            }
        );

        return res.json({ success: true, message: "Story deleted successfully" });

    } catch (error) {
        console.error("Delete Story Error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
