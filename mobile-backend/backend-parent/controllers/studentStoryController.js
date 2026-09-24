const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");

/**
 * GET STORIES FOR STUDENT
 * Returns all stories relevant to the student based on class_id & division_id
 */
exports.getStudentStories = async (req, res) => {
    try {
        const student = req.student; // student info from auth middleware
        if (!student || !student.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const stories = await sequelize.query(
            `
            SELECT 
                id,
                teacher_id,
                story_type,
                category,
                story_content,
                caption,
                media_url,
                created_at
            FROM teacher_stories
            WHERE class_id = :class_id
              AND division_id = :division_id
              AND created_at >= NOW() - INTERVAL '24 hours'
            ORDER BY created_at DESC
            `,
            {
                replacements: {
                    class_id: student.class_id,
                    division_id: student.division_id
                },
                type: QueryTypes.SELECT
            }
        );

        // Separate stories by type (optional)
        const textStories = stories.filter(s => s.story_type === "text");
        const imageStories = stories.filter(s => s.story_type === "image");
        const videoStories = stories.filter(s => s.story_type === "video");

        return res.json({
            success: true,
            count: stories.length,
            stories: {
                text: textStories,
                image: imageStories,
                video: videoStories
            }
        });

    } catch (error) {
        console.error("Get Student Stories Error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
