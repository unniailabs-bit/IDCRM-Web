const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");
const crypto = require("crypto");

// ---------------- GENERATE STUDENT ID & DEDUCT CREDIT ----------------
// ---------------- GENERATE STUDENT ID & DEDUCT CREDIT (BULK SUPPORT) ----------------
exports.generateStudentId = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const school_id = req.school?.id || req.user?.school_id;
    let { student_form_id, student_form_ids } = req.body;

    // Normalize input to array
    let idsToProcess = [];
    if (student_form_ids && Array.isArray(student_form_ids)) {
      idsToProcess = student_form_ids;
    } else if (student_form_id) {
      idsToProcess = [student_form_id];
    }

    if (!school_id || idsToProcess.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "❌ school_id or student_form_ids missing"
      });
    }

    // 0️⃣ Check which IDs are already generated
    // We fetch all records matching the requested IDs
    const existingRecords = await sequelize.query(
      `SELECT student_form_id, generated_id FROM student_generated_ids WHERE student_form_id IN (:ids)`,
      {
        replacements: { ids: idsToProcess },
        type: QueryTypes.SELECT,
        transaction
      }
    );

    const existingMap = new Map();
    existingRecords.forEach(r => existingMap.set(r.student_form_id, r.generated_id));

    const newIdsToGenerate = [];
    const alreadyGenerated = [];

    idsToProcess.forEach(id => {
      if (existingMap.has(id)) {
        alreadyGenerated.push({
          student_form_id: id,
          generated_id: existingMap.get(id)
        });
      } else {
        newIdsToGenerate.push(id);
      }
    });

    // If no new IDs to generate, return early without deduction
    if (newIdsToGenerate.length === 0) {
      await transaction.commit();
      return res.status(200).json({
        success: true,
        message: "ℹ️ All submitted students already have IDs. No credits deducted.",
        data: {
          generated: [],
          existing: alreadyGenerated,
          credits_deducted: 0,
          remaining_credit: null // Not fetched/modified
        }
      });
    }

    //  Get trust linked to this school & Lock
    const schoolData = await sequelize.query(
      `
      SELECT s.id AS school_id, s.trust_id, t.credit AS trust_credit
      FROM schools s
      JOIN trusts t ON t.id = s.trust_id
      WHERE s.id = :school_id
      FOR UPDATE
      `,
      {
        replacements: { school_id },
        type: QueryTypes.SELECT,
        transaction
      }
    );

    if (!schoolData.length) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "❌ School or linked trust not found"
      });
    }

    const { trust_id, trust_credit } = schoolData[0];
    const creditsNeeded = newIdsToGenerate.length;

    //  Check if trust has enough credit
    if (trust_credit < creditsNeeded) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `❌ Insufficient trust credit. Needed: ${creditsNeeded}, Available: ${trust_credit}`
      });
    }

    //  Generate unique IDs & Prepare Inserts
    const generatedData = [];
    const recordsToInsert = newIdsToGenerate.map(id => {
      const generated_id = crypto.randomBytes(6).toString("hex").toUpperCase();
      generatedData.push({ student_form_id: id, generated_id });
      return `(${id}, ${school_id}, '${generated_id}', 1, NOW())`;
    });

    // Batch Insert into student_generated_ids
    await sequelize.query(
      `
      INSERT INTO student_generated_ids
      (student_form_id, school_id, generated_id, credits_deducted, created_at)
      VALUES ${recordsToInsert.join(', ')}
      `,
      {
        type: QueryTypes.INSERT,
        transaction
      }
    );

    //  Deduct credit from trust
    const newCredit = trust_credit - creditsNeeded;

    await sequelize.query(
      `
      UPDATE trusts
      SET credit = :new_credit
      WHERE id = :trust_id
      `,
      {
        replacements: { new_credit: newCredit, trust_id },
        type: QueryTypes.UPDATE,
        transaction
      }
    );

    //  Insert into trust_credit_transactions
    await sequelize.query(
      `
      INSERT INTO trust_credit_transactions
      (trust_id, school_id, amount, previous_credit, new_credit, type, reason, created_by, "createdAt", "updatedAt")
      VALUES
      (:trust_id, :school_id, :amount, :previous_credit, :new_credit, 'use', :reason, :created_by, NOW(), NOW())
      `,
      {
        replacements: {
          trust_id,
          school_id,
          amount: creditsNeeded,
          previous_credit: trust_credit,
          new_credit: newCredit,
          reason: `Student IDs Generated (Bulk: ${creditsNeeded})`,
          created_by: school_id
        },
        type: QueryTypes.INSERT,
        transaction
      }
    );

    // Commit transaction
    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: `✅ Generated ${creditsNeeded} new IDs. ${alreadyGenerated.length} already existed.`,
      data: {
        generated: generatedData,
        existing: alreadyGenerated,
        credits_deducted: creditsNeeded,
        remaining_credit: newCredit
      }
    });

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Generate ID Error:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "❌ Failed to generate IDs",
      error: error.message
    });
  }
};

// ---------------- GET STUDENT ID GENERATION STATUS LIST ----------------
exports.getStudentIDStatusList = async (req, res) => {
  try {
    const school_id = req.school?.id || req.user?.school_id;

    if (!school_id) {
      return res.status(400).json({
        success: false,
        message: "❌ school_id missing"
      });
    }

    const query = `
      SELECT 
        sf.id AS student_form_id,
        sf.first_name,
        sf.last_name,
        sf.class_name,
        sf.division_name,
        sf.roll_number,
        sg.generated_id,
        CASE 
          WHEN sg.generated_id IS NOT NULL THEN true 
          ELSE false 
        END AS is_generated,
        sg.created_at AS generated_at
      FROM student_forms sf
      LEFT JOIN student_generated_ids sg ON sf.id = sg.student_form_id
      WHERE sf.school_id = :school_id
      ORDER BY sf.class_name, sf.division_name, sf.roll_number
    `;

    const statusList = await sequelize.query(query, {
      replacements: { school_id },
      type: QueryTypes.SELECT
    });

    return res.status(200).json({
      success: true,
      message: " Student ID status list fetched successfully",
      data: statusList
    });

  } catch (error) {
    console.error("Get ID Status List Error:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "❌ Failed to fetch ID status list",
      error: error.message
    });
  }
};
