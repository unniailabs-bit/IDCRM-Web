const path = require('path');
const fs = require('fs');
const sequelize = require('../../config/db');
const { QueryTypes } = require('sequelize');

// ================================
// POST - Add Award
// ================================
exports.addAward = async (req, res) => {
  try {
    const teacher = req.teacher;
    if (!teacher || !teacher.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { awarded_to, award_title, category, medal_type, achievement, date_awarded, description, class_id, division_id } = req.body;

    if (!awarded_to || !award_title || !category || !medal_type || !achievement || !date_awarded || !class_id || !division_id) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }

    // Sanitize strings
    const sanitize = (val) => (typeof val === 'string' ? val.replace(/^"|"$/g, '') : val);
    const cleanAwardedTo = sanitize(awarded_to);
    const cleanAwardTitle = sanitize(award_title);
    const cleanCategory = sanitize(category);
    const cleanMedalType = sanitize(medal_type);
    const cleanAchievement = sanitize(achievement);
    const cleanDescription = description ? sanitize(description) : null;

    // File upload
    let award_image = null;
    if (req.file) {
      award_image = `/uploads/awards/${req.file.filename}`;
    }

    const [result] = await sequelize.query(
      `
      INSERT INTO teacher_awards
      (teacher_id, school_id, awarded_to, award_title, category, medal_type, achievement, date_awarded, description, class_id, division_id, award_image)
      VALUES
      (:teacher_id, :school_id, :awarded_to, :award_title, :category, :medal_type, :achievement, :date_awarded, :description, :class_id, :division_id, :award_image)
      RETURNING *
      `,
      {
        replacements: {
          teacher_id: teacher.id,
          school_id: teacher.school_id,
          awarded_to: cleanAwardedTo,
          award_title: cleanAwardTitle,
          category: cleanCategory,
          medal_type: cleanMedalType,
          achievement: cleanAchievement,
          date_awarded,
          description: cleanDescription,
          class_id,
          division_id,
          award_image
        },
        type: QueryTypes.INSERT
      }
    );

    res.status(201).json({
      success: true,
      message: 'Award added successfully',
      data: result[0]
    });

  } catch (error) {
    console.error('Add Award Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ================================
// GET - All Awards for Teacher
// ================================
exports.getAwards = async (req, res) => {
  try {
    const teacher = req.teacher;
    if (!teacher || !teacher.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const awards = await sequelize.query(
      `
      SELECT ta.*, 
             sf.first_name AS student_first_name,
             sf.last_name AS student_last_name,
             c.class_name,
             d.division_name
      FROM teacher_awards ta
      JOIN student_forms sf ON sf.id = ta.awarded_to
      JOIN classes c ON c.id = sf.class_id
      JOIN divisions d ON d.id = sf.division_id
      WHERE ta.teacher_id = :teacher_id
      ORDER BY ta.date_awarded DESC
      `,
      {
        replacements: { teacher_id: teacher.id },
        type: QueryTypes.SELECT
      }
    );

    const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;

    const result = awards.map(a => ({
      ...a,
      award_image: a.award_image ? `${baseUrl}${a.award_image}` : null
    }));

    res.status(200).json({ success: true, count: result.length, data: result });

  } catch (error) {
    console.error('Get Awards Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ================================
// GET - Single Award by ID
// ================================
exports.getAwardById = async (req, res) => {
  try {
    const teacher = req.teacher;
    const { id } = req.params;

    if (!teacher || !teacher.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const [award] = await sequelize.query(
      `
      SELECT ta.*, 
             sf.first_name AS student_first_name,
             sf.last_name AS student_last_name,
             c.class_name,
             d.division_name
      FROM teacher_awards ta
      JOIN student_forms sf ON sf.id = ta.awarded_to
      JOIN classes c ON c.id = ta.class_id
      JOIN divisions d ON d.id = ta.division_id
      WHERE ta.teacher_id = :teacher_id AND ta.id = :id
      `,
      { replacements: { teacher_id: teacher.id, id }, type: QueryTypes.SELECT }
    );

    if (!award) {
      return res.status(404).json({ success: false, message: 'Award not found' });
    }

    const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    award.award_image = award.award_image ? `${baseUrl}${award.award_image}` : null;

    res.status(200).json({ success: true, data: award });

  } catch (error) {
    console.error('Get Award By ID Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ================================
// DELETE - Award by ID
// ================================
exports.deleteAward = async (req, res) => {
  try {
    const teacher = req.teacher;
    const { id } = req.params;

    if (!teacher || !teacher.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const [award] = await sequelize.query(
      `SELECT * FROM teacher_awards WHERE id = :id AND teacher_id = :teacher_id`,
      { replacements: { id, teacher_id: teacher.id }, type: QueryTypes.SELECT }
    );

    if (!award) {
      return res.status(404).json({ success: false, message: 'Award not found' });
    }

    // Delete photo if exists
    if (award.award_image) {
      const filePath = path.join(__dirname, '..', award.award_image);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await sequelize.query(
      `DELETE FROM teacher_awards WHERE id = :id AND teacher_id = :teacher_id`,
      { replacements: { id, teacher_id: teacher.id }, type: QueryTypes.DELETE }
    );

    res.status(200).json({ success: true, message: 'Award deleted successfully' });

  } catch (error) {
    console.error('Delete Award Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
