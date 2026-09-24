const { QueryTypes } = require("sequelize");
const sequelize = require("../../config/db");

// -------------------- Create Fee Plan ----------------
exports.createFeePlan = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const school_id = req.user?.school_id;
        const { class_id, annual_fee, late_fee_penalty, number_of_installments, installments } = req.body;

        if (!school_id) {
            await transaction.rollback();
            return res.status(401).json({ success: false, message: "Unauthorized: School not found." });
        }

        // Basic validations
        if (!class_id || !annual_fee || !number_of_installments || !installments) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        if (installments.length !== parseInt(number_of_installments)) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: "Mismatch between number of installments and provided installments data." });
        }

        // Check if a plan already exists for this class
        const existingPlan = await sequelize.query(
            `SELECT id FROM school_fee_plans WHERE school_id = :school_id AND class_id = :class_id`,
            { replacements: { school_id, class_id }, type: QueryTypes.SELECT, transaction }
        );

        if (existingPlan.length > 0) {
            await transaction.rollback();
            return res.status(409).json({ success: false, message: "Fee plan already exists for this class." });
        }

        // Insert Fee Plan
        const planQuery = `
      INSERT INTO school_fee_plans (school_id, class_id, annual_fee, late_fee_penalty, number_of_installments, status, created_at, updated_at)
      VALUES (:school_id, :class_id, :annual_fee, :late_fee_penalty, :number_of_installments, 'ACTIVE', NOW(), NOW())
      RETURNING *;
    `;
        const [insertedPlan] = await sequelize.query(planQuery, {
            replacements: {
                school_id,
                class_id,
                annual_fee,
                late_fee_penalty: late_fee_penalty || 0,
                number_of_installments
            },
            type: QueryTypes.INSERT,
            transaction
        });

        const fee_plan_id = insertedPlan[0].id;

        // Insert Installments
        for (const inst of installments) {
            const { installment_no, installment_name, amount, due_date } = inst;
            const installmentQuery = `
        INSERT INTO school_fee_installments (fee_plan_id, installment_no, installment_name, amount, due_date, status, created_at)
        VALUES (:fee_plan_id, :installment_no, :installment_name, :amount, :due_date, 'ACTIVE', NOW())
      `;
            await sequelize.query(installmentQuery, {
                replacements: {
                    fee_plan_id,
                    installment_no,
                    installment_name,
                    amount,
                    due_date
                },
                type: QueryTypes.INSERT,
                transaction
            });
        }

        await transaction.commit();
        res.status(201).json({ success: true, message: "Fee plan created successfully.", data: insertedPlan[0] });

    } catch (error) {
        await transaction.rollback();
        console.error("Create Fee Plan Error:", error);
        res.status(500).json({ success: false, message: "Server error while creating fee plan", error: error.message });
    }
};

// -------------------- Get Fee Plan by Class --------------------
exports.getFeePlan = async (req, res) => {
    try {
        const school_id = req.user?.school_id;
        const { class_id } = req.params;

        if (!school_id) return res.status(401).json({ success: false, message: "Unauthorized." });
        if (!class_id) return res.status(400).json({ success: false, message: "Class ID is required." });

        // Fetch Plan
        const plan = await sequelize.query(
            `SELECT * FROM school_fee_plans WHERE school_id = :school_id AND class_id = :class_id`,
            { replacements: { school_id, class_id }, type: QueryTypes.SELECT }
        );

        if (plan.length === 0) {
            return res.status(404).json({ success: false, message: "No fee plan found for this class." });
        }

        const fee_plan_id = plan[0].id;

        // Fetch Installments
        const installments = await sequelize.query(
            `SELECT * FROM school_fee_installments WHERE fee_plan_id = :fee_plan_id ORDER BY installment_no ASC`,
            { replacements: { fee_plan_id }, type: QueryTypes.SELECT }
        );

        res.status(200).json({
            success: true,
            data: {
                ...plan[0],
                installments
            }
        });

    } catch (error) {
        console.error("Get Fee Plan Error:", error);
        res.status(500).json({ success: false, message: "Server error while fetching fee plan" });
    }
};

// -------------------- Update Fee Plan --------------------
exports.updateFeePlan = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const school_id = req.user?.school_id;
        const { class_id } = req.params;
        const { annual_fee, late_fee_penalty, number_of_installments, installments } = req.body;

        if (!school_id) {
            await transaction.rollback();
            return res.status(401).json({ success: false, message: "Unauthorized." });
        }

        // Check if plan exists
        const existingPlan = await sequelize.query(
            `SELECT id FROM school_fee_plans WHERE school_id = :school_id AND class_id = :class_id`,
            { replacements: { school_id, class_id }, type: QueryTypes.SELECT, transaction }
        );

        if (existingPlan.length === 0) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: "Fee plan not found." });
        }

        const fee_plan_id = existingPlan[0].id;

        // Update Plan Details
        await sequelize.query(
            `UPDATE school_fee_plans 
       SET annual_fee = :annual_fee, 
           late_fee_penalty = :late_fee_penalty, 
           number_of_installments = :number_of_installments,
           updated_at = NOW()
       WHERE id = :fee_plan_id`,
            {
                replacements: {
                    annual_fee,
                    late_fee_penalty: late_fee_penalty || 0,
                    number_of_installments,
                    fee_plan_id
                },
                type: QueryTypes.UPDATE,
                transaction
            }
        );

        // Delete existing installments (full replacement strategy is safer/easier for now to ensure consistency)
        await sequelize.query(
            `DELETE FROM school_fee_installments WHERE fee_plan_id = :fee_plan_id`,
            { replacements: { fee_plan_id }, type: QueryTypes.DELETE, transaction }
        );

        // Insert New Installments
        if (installments && installments.length > 0) {
            for (const inst of installments) {
                const { installment_no, installment_name, amount, due_date } = inst;
                await sequelize.query(
                    `INSERT INTO school_fee_installments (fee_plan_id, installment_no, installment_name, amount, due_date, status, created_at)
             VALUES (:fee_plan_id, :installment_no, :installment_name, :amount, :due_date, 'ACTIVE', NOW())`,
                    {
                        replacements: {
                            fee_plan_id,
                            installment_no,
                            installment_name,
                            amount,
                            due_date
                        },
                        type: QueryTypes.INSERT,
                        transaction
                    }
                );
            }
        }

        await transaction.commit();
        res.status(200).json({ success: true, message: "Fee plan updated successfully." });

    } catch (error) {
        await transaction.rollback();
        console.error("Update Fee Plan Error:", error);
        res.status(500).json({ success: false, message: "Server error while updating fee plan", error: error.message });
    }
};

// -------------------- Delete Fee Plan --------------------
exports.deleteFeePlan = async (req, res) => {
    try {
        const school_id = req.user?.school_id;
        const { class_id } = req.params;

        if (!school_id) return res.status(401).json({ success: false, message: "Unauthorized." });

        // Check plan existence
        const existingPlan = await sequelize.query(
            `SELECT id FROM school_fee_plans WHERE school_id = :school_id AND class_id = :class_id`,
            { replacements: { school_id, class_id }, type: QueryTypes.SELECT }
        );

        if (existingPlan.length === 0) {
            return res.status(404).json({ success: false, message: "Fee plan not found." });
        }

        const fee_plan_id = existingPlan[0].id;

        // Delete Plan (Cascade should handle installments, but let's be safe if FK is not robust)
        // Actually schema showed ON DELETE CASCADE, so deleting plan is enough.
        await sequelize.query(
            `DELETE FROM school_fee_plans WHERE id = :fee_plan_id`,
            { replacements: { fee_plan_id }, type: QueryTypes.DELETE }
        );

        res.status(200).json({ success: true, message: "Fee plan deleted successfully." });

    } catch (error) {
        console.error("Delete Fee Plan Error:", error);
        res.status(500).json({ success: false, message: "Server error while deleting fee plan" });
    }
};

// -------------------- Get All Fee Plans for School --------------------
exports.getAllFeePlans = async (req, res) => {
    try {
        const school_id = req.user?.school_id;

        if (!school_id) return res.status(401).json({ success: false, message: "Unauthorized." });

        // Fetch all plans for the school with class details
        const plans = await sequelize.query(
            `SELECT p.*, c.class_name, c.section 
             FROM school_fee_plans p
             JOIN classes c ON p.class_id = c.id
             WHERE p.school_id = :school_id
             ORDER BY c.class_name ASC`,
            { replacements: { school_id }, type: QueryTypes.SELECT }
        );

        if (plans.length === 0) {
            return res.status(200).json({ success: true, data: [] }); // Return empty array if no plans
        }

        // Fetch all installments for these plans
        const planIds = plans.map(p => p.id);

        let installments = [];
        if (plans.length > 0) {
            installments = await sequelize.query(
                `SELECT * FROM school_fee_installments WHERE fee_plan_id IN (:planIds) ORDER BY installment_no ASC`,
                { replacements: { planIds }, type: QueryTypes.SELECT }
            );
        }

        // Map installments to their respective plans
        const plansWithInstallments = plans.map(plan => {
            return {
                ...plan,
                installments: installments.filter(inst => inst.fee_plan_id === plan.id)
            };
        });

        res.status(200).json({
            success: true,
            data: plansWithInstallments
        });

    } catch (error) {
        console.error("Get All Fee Plans Error:", error);
        res.status(500).json({ success: false, message: "Server error while fetching all fee plans" });
    }
};
