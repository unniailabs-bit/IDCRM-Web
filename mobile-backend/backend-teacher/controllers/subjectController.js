const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");

/**
 * ADD NEW SUBJECT
 * Step 1 in the syllabus flow
 */
exports.addSubject = async (req, res) => {
    try {
        const teacher = req.teacher;
        const { class_id, division_id, subject_name } = req.body;

        if (!teacher || !teacher.id) {
            return res.status(200).json({ success: false, message: "Unauthorized" });
        }

        if (!class_id || !division_id || !subject_name) {
            return res.status(200).json({ success: false, message: "class_id, division_id, and subject_name are required" });
        }

        // Insert subject, ignore if already exists (due to UNIQUE constraint)
        await sequelize.query(
            `
            INSERT INTO teacher_subjects (teacher_id, school_id, class_id, division_id, subject_name)
            VALUES (:teacher_id, :school_id, :class_id, :division_id, :subject_name)
            ON CONFLICT (teacher_id, class_id, division_id, subject_name) DO NOTHING
            `,
            {
                replacements: {
                    teacher_id: teacher.id,
                    school_id: teacher.school_id,
                    class_id,
                    division_id,
                    subject_name: subject_name.trim()
                },
                type: QueryTypes.INSERT
            }
        );

        return res.json({
            success: true,
            message: "Subject added successfully"
        });

    } catch (error) {
        console.error("Add Subject Error:", error);
        return res.status(200).json({ success: false, message: "Unable to load subjects. Please try again." });
    }
};

/**
 * GET SUBJECTS FOR TEACHER
 */
exports.getSubjects = async (req, res) => {
    try {
        const teacher = req.teacher;
        const { class_id, division_id } = req.query;

        if (!teacher || !teacher.id) {
            return res.status(200).json({ success: false, message: "Unauthorized" });
        }

        if (!class_id || !division_id) {
            return res.status(200).json({ success: false, message: "Please select a class and division." });
        }

        const subjects = await sequelize.query(
            `
            SELECT id, subject_name 
            FROM teacher_subjects 
            WHERE teacher_id = :teacher_id 
              AND class_id = :class_id 
              AND division_id = :division_id
            ORDER BY subject_name ASC
            `,
            {
                replacements: {
                    teacher_id: teacher.id,
                    class_id,
                    division_id
                },
                type: QueryTypes.SELECT
            }
        );

        return res.json({
            success: true,
            subjects
        });

    } catch (error) {
        console.error("Get Subjects Error:", error);
        return res.status(200).json({ success: false, message: "Could not create subject. Please try again." });
    }
};

/**
 * UPDATE SUBJECT
 */
exports.updateSubject = async (req, res) => {
    try {
        const teacher = req.teacher;
        const { id, subject_name } = req.body;

        if (!teacher || !teacher.id) {
            return res.status(200).json({ success: false, message: "Unauthorized" });
        }

        if (!id) {
            return res.status(200).json({ success: false, message: "Subject ID is missing." });
        }

        let updateFields = [];
        let replacements = { id, teacher_id: teacher.id };

        if (subject_name !== undefined) {
            updateFields.push("subject_name = :subject_name");
            replacements.subject_name = subject_name;
        }

        if (updateFields.length === 0) {
            return res.status(200).json({ success: false, message: "Please provide at least one field to update." });
        }

        const query = `
            UPDATE teacher_subjects 
            SET ${updateFields.join(", ")}
            WHERE id = :id AND teacher_id = :teacher_id
            RETURNING *
        `;

        const [result] = await sequelize.query(query, {
            replacements,
            type: QueryTypes.UPDATE
        });

        if (!result || result.length === 0) {
            return res.status(200).json({ success: false, message: "Subject not found or you don't have permission." });
        }

        return res.json({ success: true, message: "Subject updated successfully", subject: result[0] });

    } catch (error) {
        console.error("Update Subject Error:", error);
        return res.status(200).json({ success: false, message: "Could not update subject. Please try again." });
    }
};

/**
 * DELETE SUBJECT
 * Note: This will NOT delete materials, but they will lose their subject reference if CASCADE is not set.
 */
exports.deleteSubject = async (req, res) => {
    try {
        const teacher = req.teacher;
        const { id } = req.params;

        if (!teacher || !teacher.id) {
            return res.status(200).json({ success: false, message: "Unauthorized" });
        }

        const result = await sequelize.query(
            `DELETE FROM teacher_subjects WHERE id = :id AND teacher_id = :teacher_id`,
            {
                replacements: { id, teacher_id: teacher.id },
                type: QueryTypes.DELETE
            }
        );

        return res.json({ success: true, message: "Subject deleted successfully" });

    } catch (error) {
        console.error("Delete Subject Error:", error);
        return res.status(200).json({ success: false, message: "Could not delete subject. Please try again." });
    }
};
