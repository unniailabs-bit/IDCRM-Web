const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");

/**
 * GET - Fetch Student Fee Details
 * Retrieves fee structure for the student's assigned class.
 */
exports.getFeeDetails = async (req, res) => {
    try {
        const student = req.parent; // Authenticated student/parent

        if (!student || !student.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { class_id, school_id } = student;

        // 1️⃣ Fetch Fee Plan for the student's class
        const feePlans = await sequelize.query(
            `
            SELECT id, annual_fee, late_fee_penalty, number_of_installments, status, updated_at
            FROM school_fee_plans
            WHERE class_id = :class_id AND school_id = :school_id AND status = 'ACTIVE'
            `,
            {
                replacements: { class_id, school_id },
                type: QueryTypes.SELECT
            }
        );

        if (!feePlans.length) {
            return res.status(404).json({
                success: false,
                message: "No fee plan found for this class."
            });
        }

        const feePlan = feePlans[0];

        // 2️⃣ Fetch Installments for the plan
        const installments = await sequelize.query(
            `
            SELECT id, installment_no, installment_name, amount, due_date, status
            FROM school_fee_installments
            WHERE fee_plan_id = :fee_plan_id AND status = 'ACTIVE'
            ORDER BY installment_no ASC
            `,
            {
                replacements: { fee_plan_id: feePlan.id },
                type: QueryTypes.SELECT
            }
        );

        return res.json({
            success: true,
            plan: feePlan,
            installments: installments
        });

    } catch (error) {
        console.error("Get Student Fee Matches Error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
