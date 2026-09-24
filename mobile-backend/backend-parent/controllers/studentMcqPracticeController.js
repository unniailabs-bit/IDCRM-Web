const sequelize = require("../../config/db");

/**
 * START PRACTICE
 * Creates a new practice session
 */
exports.startPractice = async (req, res) => {
  try {
    const student = req.student;
    const { material_id } = req.body;

    if (!student || !student.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // Count total MCQs for student class & division
    const [result] = await sequelize.query(
      `
      SELECT COUNT(*)::int AS total
      FROM mcq_questions
      WHERE class_id = :class_id
        AND division_id = :division_id
        AND school_id = :school_id
        AND is_active = true
        ${material_id ? "AND material_id = :material_id" : ""}
      `,
      {
        replacements: {
          class_id: student.class_id,
          division_id: student.division_id,
          school_id: student.school_id,
          material_id: material_id || null
        },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (result.total === 0) {
      return res.status(404).json({
        success: false,
        message: "No MCQs available"
      });
    }

    const [session] = await sequelize.query(
      `
      INSERT INTO mcq_practice_sessions
      (student_id, school_id, class_id, division_id, total_questions)
      VALUES (:student_id, :school_id, :class_id, :division_id, :total_questions)
      RETURNING *
      `,
      {
        replacements: {
          student_id: student.id,
          school_id: student.school_id,
          class_id: student.class_id,
          division_id: student.division_id,
          total_questions: result.total
        },
        type: sequelize.QueryTypes.INSERT
      }
    );

    res.json({
      success: true,
      practice_id: session[0].id,
      total_questions: result.total
    });

  } catch (err) {
    console.error("Start Practice Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * SUBMIT PRACTICE
 * Submits all answers at once
 */
exports.submitPractice = async (req, res) => {
  try {
    const student = req.student;
    const { practice_id, answers } = req.body;

    if (!student || !student.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (!practice_id) {
      return res.status(400).json({
        success: false,
        message: "practice_id is required"
      });
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "answers must be a non-empty array"
      });
    }

    let correct = 0;
    let wrong = 0;
    const results = [];

    for (const ans of answers) {
      const [mcq] = await sequelize.query(
        `
        SELECT id, question, option_a, option_b, option_c, option_d, correct_answer, explanation
        FROM mcq_questions
        WHERE id = :mcq_id
        `,
        {
          replacements: { mcq_id: ans.mcq_id },
          type: sequelize.QueryTypes.SELECT
        }
      );

      if (!mcq) {
        results.push({
          mcq_id: ans.mcq_id,
          status: "not_found"
        });
        continue;
      }

      const isCorrect = mcq.correct_answer === ans.selected_answer;

      if (isCorrect) correct++;
      else wrong++;

      results.push({
        mcq_id: ans.mcq_id,
        question: mcq.question,
        option_a: mcq.option_a,
        option_b: mcq.option_b,
        option_c: mcq.option_c,
        option_d: mcq.option_d,
        selected_answer: ans.selected_answer,
        correct_answer: mcq.correct_answer,
        is_correct: isCorrect,
        explanation: mcq.explanation
      });
    }

    const totalProcessed = correct + wrong;
    const percentage = totalProcessed > 0 ? ((correct / totalProcessed) * 100).toFixed(2) : "0.00";

    // Update session summary
    await sequelize.query(
      `
      UPDATE mcq_practice_sessions
      SET correct_answers = :correct,
          wrong_answers = :wrong,
          score_percentage = :percentage,
          completed_at = NOW()
      WHERE id = :practice_id
      `,
      {
        replacements: {
          correct,
          wrong,
          percentage,
          practice_id
        }
      }
    );

    // Save individual results for unique tracking
    for (const res of results) {
      if (res.status === "not_found") continue;
      await sequelize.query(
        `
        INSERT INTO mcq_practice_results (student_id, mcq_id, is_correct, updated_at)
        VALUES (:student_id, :mcq_id, :is_correct, NOW())
        ON CONFLICT (student_id, mcq_id) 
        DO UPDATE SET is_correct = EXCLUDED.is_correct, updated_at = NOW()
        `,
        {
          replacements: {
            student_id: student.id,
            mcq_id: res.mcq_id,
            is_correct: res.is_correct
          }
        }
      );
    }

    res.json({
      success: true,
      total: correct + wrong,
      correct,
      wrong,
      percentage,
      results
    });

  } catch (err) {
    console.error("Submit Practice Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * PRACTICE HISTORY
 */
exports.getPracticeHistory = async (req, res) => {
  try {
    const student = req.student;

    if (!student || !student.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const history = await sequelize.query(
      `
      SELECT 
        id,
        total_questions,
        correct_answers,
        wrong_answers,
        score_percentage,
        started_at,
        completed_at
      FROM mcq_practice_sessions
      WHERE student_id = :student_id
      ORDER BY started_at DESC
      `,
      {
        replacements: { student_id: student.id },
        type: sequelize.QueryTypes.SELECT
      }
    );

    res.json({
      success: true,
      count: history.length,
      history
    });

  } catch (err) {
    console.error("Practice History Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// -----------------------------
// Get MCQs grouped by Material
// + additionally return MCQs without material_id
//   (shown with created_at date/time)
// -----------------------------
exports.getMaterialWiseMcqs = async (req, res) => {
  try {
    const { id: student_id, class_id, division_id, school_id } = req.student;

    // 1. Calculate Overall Stats
    // Total MCQs available for the student
    const totalMcqsQuery = `
      SELECT COUNT(*)::int as count 
      FROM mcq_questions 
      WHERE class_id = :class_id 
      AND division_id = :division_id 
      AND school_id = :school_id 
      AND is_active = true
    `;

    // Total Attempted and Accuracy from unique results tracking table
    const practiceStatsQuery = `
      SELECT 
        COUNT(*)::int as total_attempted,
        COUNT(*) FILTER (WHERE is_correct = true)::int as total_correct
      FROM mcq_practice_results
      WHERE student_id = :student_id
    `;

    const [totalMcqsResult] = await sequelize.query(totalMcqsQuery, {
      replacements: { class_id, division_id, school_id },
      type: sequelize.QueryTypes.SELECT
    });

    const [practiceStats] = await sequelize.query(practiceStatsQuery, {
      replacements: { student_id },
      type: sequelize.QueryTypes.SELECT
    });

    const total_mcqs_overall = totalMcqsResult.count || 0;
    const total_attempted_overall = practiceStats.total_attempted || 0;
    const total_correct_overall = practiceStats.total_correct || 0;

    const accuracy_overall = total_attempted_overall > 0
      ? ((total_correct_overall / total_attempted_overall) * 100).toFixed(2)
      : "0.00";

    // 2. Get Material-wise Data (for MCQs that have material_id)
    const materialQuery = `
      SELECT 
        m.id AS material_id,
        m.title AS material_title,
        m.subject_id,
        s.subject_name AS material_subject,
        m.material_type,
        COUNT(DISTINCT q.id)::int AS total_mcqs,
        COUNT(DISTINCT r.id)::int AS attempted,         
        CASE 
          WHEN COUNT(DISTINCT r.id) > 0 THEN 
            ROUND((COUNT(DISTINCT r.id) FILTER (WHERE r.is_correct = true) * 100.0 / NULLIF(COUNT(DISTINCT r.id), 0)), 2)::text
          ELSE '0.00' 
        END AS avg_accuracy, 
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', q.id,
              'question', q.question,
              'option_a', q.option_a,
              'option_b', q.option_b,
              'option_c', q.option_c,
              'option_d', q.option_d,
              'correct_answer', q.correct_answer,
              'explanation', q.explanation
            )
          ),
          '[]'
        ) AS mcqs
      FROM materials m
      JOIN mcq_questions q ON q.material_id = m.id AND q.is_active = true
      LEFT JOIN teacher_subjects s ON m.subject_id = s.id
      LEFT JOIN mcq_practice_results r ON r.mcq_id = q.id AND r.student_id = :student_id
      WHERE m.class_id = :class_id 
        AND m.division_id = :division_id 
        AND m.school_id = :school_id
      GROUP BY m.id, s.subject_name
      ORDER BY m.created_at DESC
    `;

    const materials = await sequelize.query(materialQuery, {
      replacements: { class_id, division_id, school_id, student_id },
      type: sequelize.QueryTypes.SELECT
    });

    // 3. MCQs without material_id (material_id IS NULL)
    //    These will be shown with created_at (date & time).
    const unassignedQuery = `
      SELECT 
        q.id,
        q.subject_id,
        s.subject_name,
        q.title,
        q.question,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.correct_answer,
        q.explanation,
        q.created_at
      FROM mcq_questions q
      LEFT JOIN teacher_subjects s ON q.subject_id = s.id
      WHERE q.class_id = :class_id 
        AND q.division_id = :division_id 
        AND q.school_id = :school_id
        AND q.is_active = true
        AND q.material_id IS NULL
      ORDER BY q.created_at DESC, q.id ASC
    `;

    const unassignedMcqs = await sequelize.query(unassignedQuery, {
      replacements: { class_id, division_id, school_id },
      type: sequelize.QueryTypes.SELECT
    });

    // 4. Group unassigned MCQs by title
    const unassignedGroupedMap = {};
    for (const row of unassignedMcqs) {
      const title = row.title || (row.subject_name ? `${row.subject_name} Practice` : "General Practice");
      const groupKey = `${title}_${row.subject_id || "general"}`;

      if (!unassignedGroupedMap[groupKey]) {
        unassignedGroupedMap[groupKey] = {
          title: title,
          subject_name: row.subject_name || "General",
          subject_id: row.subject_id || null,
          created_at: row.created_at,
          mcqs: []
        };
      }
      
      // Also clean up individual mcq object
      row.subject_name = row.subject_name || "General";
      unassignedGroupedMap[groupKey].mcqs.push(row);
    }

    const unassignedMcqsGrouped = Object.values(unassignedGroupedMap).sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    return res.json({
      success: true,
      overall_stats: {
        total_mcqs: total_mcqs_overall,
        total_attempted: total_attempted_overall,
        average_accuracy_percentage: accuracy_overall
      },
      materials,
      // Grouped by created_at: each group = same date-time
      unassigned_mcqs: unassignedMcqsGrouped
    });

  } catch (error) {
    console.error("Get Material Wise MCQs Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
