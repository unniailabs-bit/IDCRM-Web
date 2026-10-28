const { QueryTypes } = require("sequelize");
const sequelize = require("../../config/db");
const bcrypt = require("bcryptjs");

/**
 * Reset student/parent password by phone number.
 * Resets password in: student_forms, parent_accounts (if exists), parent_student_links (linked students).
 * Only allows resetting students belonging to the caller's school.
 *
 * POST /api/school/reset-student-password
 * Body: { phone, new_password }
 */
exports.resetStudentPassword = async (req, res) => {
    try {
        const schoolId = req.user?.school_id;
        if (!schoolId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { phone, new_password } = req.body;
        if (!phone || !new_password) {
            return res.status(400).json({
                success: false,
                message: "phone and new_password are required",
            });
        }

        if (new_password.length < 4) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 4 characters",
            });
        }

        // Normalize phone to last 10 digits
        const digits = String(phone).replace(/\D/g, "");
        const normalizedPhone = digits.length >= 10 ? digits.slice(-10) : null;
        if (!normalizedPhone) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number",
            });
        }

        const phoneSql = (col) =>
            `RIGHT(REGEXP_REPLACE(COALESCE(${col}, ''), '[^0-9]', '', 'g'), 10)`;

        // Hash the new password
        const hashed = await bcrypt.hash(String(new_password), 10);

        // 1. Find students in THIS school matching the phone
        const students = await sequelize.query(
            `SELECT id, first_name, last_name, father_phone, mother_phone, roll_number,
              COALESCE(d.class_name, c.class_name) AS class_name, d.division_name
       FROM student_forms sf
       LEFT JOIN divisions d ON sf.division_id = d.id
       LEFT JOIN classes c ON COALESCE(d.class_id, sf.class_id) = c.id
       WHERE sf.school_id = :schoolId
         AND (${phoneSql("sf.father_phone")} = :phone
              OR ${phoneSql("sf.mother_phone")} = :phone)
       ORDER BY sf.id ASC`,
            { replacements: { schoolId, phone: normalizedPhone }, type: QueryTypes.SELECT }
        );

        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No students found with this phone number in your school",
            });
        }

        // 2. Update student_forms passwords
        const studentIds = students.map((s) => s.id);
        await sequelize.query(
            `UPDATE student_forms SET password = :password WHERE id IN (:studentIds)`,
            { replacements: { password: hashed, studentIds }, type: QueryTypes.UPDATE }
        );

        // 3. Update parent_accounts if the table exists
        let parentAccountUpdated = false;
        try {
            const [tableCheck] = await sequelize.query(
                `SELECT to_regclass('public.parent_accounts') AS table_name`,
                { type: QueryTypes.SELECT }
            );

            if (tableCheck?.table_name) {
                // Update parent_accounts password
                await sequelize.query(
                    `UPDATE parent_accounts SET password = :password, updated_at = NOW()
           WHERE ${phoneSql("phone")} = :phone`,
                    { replacements: { password: hashed, phone: normalizedPhone }, type: QueryTypes.UPDATE }
                );
                parentAccountUpdated = true;

                // Also update any linked students (in case they belong to other schools via same parent)
                await sequelize.query(
                    `UPDATE student_forms sf
           SET password = :password
           FROM parent_student_links psl
           JOIN parent_accounts pa ON pa.id = psl.parent_account_id
           WHERE psl.student_form_id = sf.id
             AND ${phoneSql("pa.phone")} = :phone
             AND sf.school_id = :schoolId`,
                    { replacements: { password: hashed, phone: normalizedPhone, schoolId }, type: QueryTypes.UPDATE }
                );
            }
        } catch (err) {
            console.warn("parent_accounts update skipped:", err.message);
        }

        console.log(
            `[PasswordReset] School ${schoolId} reset password for phone ${normalizedPhone}: ${students.length} student(s), parent_account: ${parentAccountUpdated}`
        );

        return res.json({
            success: true,
            message: `Password reset for ${students.length} student(s)`,
            students_reset: students.map((s) => ({
                id: s.id,
                name: `${s.first_name} ${s.last_name}`,
                roll_number: s.roll_number,
                class_name: s.class_name,
                division_name: s.division_name,
            })),
        });
    } catch (error) {
        console.error("Reset Student Password Error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * Search students by phone for password reset preview.
 * GET /api/school/search-students-by-phone?phone=9876543210
 */
exports.searchStudentsByPhone = async (req, res) => {
    try {
        const schoolId = req.user?.school_id;
        if (!schoolId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const phone = req.query.phone;
        const digits = String(phone || "").replace(/\D/g, "");
        const normalizedPhone = digits.length >= 10 ? digits.slice(-10) : null;
        if (!normalizedPhone) {
            return res.status(400).json({
                success: false,
                message: "Valid phone number required (10 digits)",
            });
        }

        const phoneSql = (col) =>
            `RIGHT(REGEXP_REPLACE(COALESCE(${col}, ''), '[^0-9]', '', 'g'), 10)`;

        const students = await sequelize.query(
            `SELECT sf.id, sf.first_name, sf.last_name, sf.father_phone, sf.mother_phone,
              sf.roll_number,
              COALESCE(d.class_name, c.class_name) AS class_name,
              d.division_name,
              CASE WHEN sf.password IS NULL THEN 'not_set'
                   WHEN sf.password LIKE '$2%' THEN 'encrypted'
                   ELSE 'plain' END AS password_status
       FROM student_forms sf
       LEFT JOIN divisions d ON sf.division_id = d.id
       LEFT JOIN classes c ON COALESCE(d.class_id, sf.class_id) = c.id
       WHERE sf.school_id = :schoolId
         AND (${phoneSql("sf.father_phone")} = :phone
              OR ${phoneSql("sf.mother_phone")} = :phone)
       ORDER BY sf.first_name ASC, sf.last_name ASC`,
            { replacements: { schoolId, phone: normalizedPhone }, type: QueryTypes.SELECT }
        );

        return res.json({
            success: true,
            phone: normalizedPhone,
            count: students.length,
            students: students.map((s) => ({
                id: s.id,
                name: `${s.first_name} ${s.last_name}`,
                roll_number: s.roll_number,
                class_name: s.class_name,
                division_name: s.division_name,
                password_status: s.password_status,
            })),
        });
    } catch (error) {
        console.error("Search Students By Phone Error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
