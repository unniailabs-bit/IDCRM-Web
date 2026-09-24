const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");
const { Parser } = require("json2csv");
const crypto = require("crypto");

/* ----------------------------------------------------
   🔵 GET CONTROLLER → ONLY SHOW STATUS
---------------------------------------------------- */
const getIDStatus = async (req, res) => {
  try {
    const schoolId = parseInt(req.user?.school_id, 10);

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID missing",
      });
    }

    const totalApproved = await sequelize.query(
      `SELECT COUNT(*) AS total
       FROM student_forms
       WHERE school_id = :schoolId
       AND LOWER(TRIM(status)) = 'approved'`,
      { replacements: { schoolId }, type: QueryTypes.SELECT }
    );
    const totalApprovedCount = parseInt(totalApproved[0].total, 10);

    const totalPrinted = await sequelize.query(
      `SELECT COUNT(*) AS total
       FROM student_generated_ids
       WHERE school_id = :schoolId`,
      { replacements: { schoolId }, type: QueryTypes.SELECT }
    );
    const totalPrintedCount = parseInt(totalPrinted[0].total, 10);

    return res.json({
      success: true,
      message:
        totalApprovedCount === totalPrintedCount
          ? "All approved students already have generated IDs"
          : "Some students still need ID generation",
      total_approved: totalApprovedCount,
      total_printed: totalPrintedCount,
      total_remaining: totalApprovedCount - totalPrintedCount,
    });
  } catch (err) {
    console.error("🔥 Error in getIDStatus:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while checking ID status",
    });
  }
};

/* ----------------------------------------------------
   🔴 POST CONTROLLER → GENERATE IDs + DEDUCT CREDITS FROM TRUST
---------------------------------------------------- */
const generateStudentIDs = async (req, res) => {
  const t = await sequelize.transaction(); // Start transaction
  try {
    const schoolId = parseInt(req.user?.school_id, 10);
    const { className, division } = req.body; // Get class and division from request body

    if (!schoolId) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "School ID missing",
      });
    }

    // --- 1️⃣ Get school's trust_id ---
    const schoolInfo = await sequelize.query(
      `SELECT trust_id FROM schools WHERE id = :schoolId`,
      { replacements: { schoolId }, type: QueryTypes.SELECT, transaction: t }
    );

    if (!schoolInfo.length) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const trustId = schoolInfo[0].trust_id;

    if (!trustId) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "School is not associated with a trust",
      });
    }

    // --- 2️⃣ Fetch students who are APPROVED and NOT YET GENERATED ---
    // Build the WHERE clause based on whether class/division are provided
    let whereClause = `sf.school_id = :schoolId
         AND LOWER(TRIM(sf.status)) = 'approved'
         AND sg.student_form_id IS NULL`;

    const replacements = { schoolId };

    // If className and division are provided, filter by them
    if (className && division) {
      whereClause += ` AND sf.division_id IN (
        SELECT d.id FROM divisions d
        INNER JOIN classes c ON d.class_id = c.id
        WHERE LOWER(d.class_name) = LOWER(:className)
        AND LOWER(d.division_name) = LOWER(:division)
        AND c.school_id = :schoolId
      )`;
      replacements.className = className;
      replacements.division = division;
    }

    const students = await sequelize.query(
      `SELECT sf.id AS student_form_id,
              sf.roll_number,
              sf.first_name || ' ' || sf.last_name AS student_name,
              sf.dob,
              sf.blood_group,
              sf.street_address || ', ' || sf.city || ', ' || sf.state || ', ' || sf.pin_code AS address,
              sf.father_name,
              COALESCE(sf.father_phone, sf.parent_phone, '') AS father_phone,
              sf.mother_name,
              COALESCE(sf.mother_phone, '') AS mother_phone,
              sf.emergency_contact
       FROM student_forms sf
       LEFT JOIN student_generated_ids sg
              ON sf.id = sg.student_form_id
       WHERE ${whereClause}
       ORDER BY sf.division_id, sf.roll_number`,
      { replacements, type: QueryTypes.SELECT, transaction: t }
    );

    if (students.length === 0) {
      await t.rollback();
      return res.json({
        success: true,
        message: "No pending students to generate IDs",
        data: [],
      });
    }

    // --- 3️⃣ Calculate total credits needed ---
    const CREDITS_PER_ID = 15;
    const totalCreditsNeeded = students.length * CREDITS_PER_ID;

    // --- 4️⃣ Check TRUST credits (not school credits) ---
    const trust = await sequelize.query(
      `SELECT credits FROM trusts WHERE id = :trustId`,
      { replacements: { trustId }, type: QueryTypes.SELECT, transaction: t }
    );

    if (!trust.length) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Trust not found",
      });
    }

    const availableTrustCredits = parseInt(trust[0].credits || 0, 10);

    if (availableTrustCredits < totalCreditsNeeded) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Insufficient trust credits. Required: ${totalCreditsNeeded}, Available: ${availableTrustCredits}`,
        required: totalCreditsNeeded,
        available: availableTrustCredits,
        shortfall: totalCreditsNeeded - availableTrustCredits,
      });
    }

    // --- 5️⃣ PROCESS EACH STUDENT ---
    let generatedData = [];
    let failedCount = 0;

    for (const student of students) {
      try {
        // Check if ID already generated (extra safety)
        const alreadyExists = await sequelize.query(
          `SELECT id FROM student_generated_ids
           WHERE student_form_id = :student_form_id
           AND school_id = :schoolId`,
          {
            replacements: {
              student_form_id: student.student_form_id,
              schoolId,
            },
            type: QueryTypes.SELECT,
            transaction: t,
          }
        );

        if (alreadyExists.length > 0) {
          continue; // Skip duplicate
        }

        // --- 6️⃣ Generate Unique ID ---
        const generatedId = crypto.randomBytes(6).toString("hex").toUpperCase();

        // --- 7️⃣ Insert Record with trust_id ---
        await sequelize.query(
          `INSERT INTO student_generated_ids 
           (student_form_id, school_id, trust_id, generated_id, credits_deducted, created_at)
           VALUES (:student_form_id, :schoolId, :trustId, :generated_id, :credits_deducted, NOW())`,
          {
            replacements: {
              student_form_id: student.student_form_id,
              schoolId,
              trustId,
              generated_id: generatedId,
              credits_deducted: CREDITS_PER_ID,
            },
            type: QueryTypes.INSERT,
            transaction: t,
          }
        );

        generatedData.push({
          ...student,
          generated_id: generatedId,
          credits_deducted: CREDITS_PER_ID,
        });
      } catch (studentError) {
        console.error(`Error processing student ${student.student_form_id}:`, studentError);
        failedCount++;
        // Continue with next student
      }
    }

    // --- 8️⃣ Deduct total credits from TRUST (single atomic update) ---
    if (generatedData.length > 0) {
      const actualCreditsDeducted = generatedData.length * CREDITS_PER_ID;
      
      await sequelize.query(
        `UPDATE trusts SET credits = credits - :totalCredits, updated_at = NOW() WHERE id = :trustId`,
        {
          replacements: {
            totalCredits: actualCreditsDeducted,
            trustId,
          },
          type: QueryTypes.UPDATE,
          transaction: t,
        }
      );
    }

    // --- 9️⃣ Commit transaction ---
    await t.commit();

    const totalGenerated = generatedData.length;
    const newTrustBalance = availableTrustCredits - (totalGenerated * CREDITS_PER_ID);

    // --- 🔟 CSV EXPORT (optional) ---
    if (req.query.export?.toLowerCase() === "csv") {
      const parser = new Parser();
      const csv = parser.parse(generatedData);

      res.header("Content-Type", "text/csv");
      res.attachment("generated_student_ids.csv");
      return res.send(csv);
    }

    return res.json({
      success: true,
      message: `${totalGenerated} IDs generated successfully${failedCount > 0 ? ` (${failedCount} failed)` : ''}`,
      data: generatedData,
      summary: {
        total_requested: students.length,
        total_generated: totalGenerated,
        total_failed: failedCount,
        credits_deducted: totalGenerated * CREDITS_PER_ID,
        trust_credits_before: availableTrustCredits,
        trust_credits_after: newTrustBalance,
        trust_credits_remaining: newTrustBalance,
      },
    });
  } catch (err) {
    // Rollback transaction on any error
    await t.rollback();
    console.error("🔥 Error in generateStudentIDs:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while generating student IDs",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

module.exports = { getIDStatus, generateStudentIDs };