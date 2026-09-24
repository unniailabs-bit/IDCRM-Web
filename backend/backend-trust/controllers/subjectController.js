const { QueryTypes } = require('sequelize');
const sequelize = require('../../config/db');

// ---------------- Get All Subjects ----------------
const getAllSubjects = async (req, res) => {
  try {
    const subjects = await sequelize.query(
      `SELECT id, name, description, created_at, updated_at 
       FROM subjects 
       ORDER BY name ASC`,
      { type: QueryTypes.SELECT }
    );

    return res.status(200).json({ 
      success: true, 
      message: 'Subjects fetched successfully',
      data: subjects 
    });
  } catch (error) {
    console.error('Get All Subjects Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching subjects' 
    });
  }
};

// ---------------- Create New Subject ----------------
const createSubject = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subject name is required' 
      });
    }

    // Check if subject already exists
    const existing = await sequelize.query(
      `SELECT id FROM subjects WHERE LOWER(name) = LOWER(:name)`,
      { replacements: { name: name.trim() }, type: QueryTypes.SELECT }
    );

    if (existing.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Subject with this name already exists' 
      });
    }

    const [insertResult] = await sequelize.query(
      `INSERT INTO subjects (name, description, created_at, updated_at)
       VALUES (:name, :description, NOW(), NOW())
       RETURNING id, name, description, created_at, updated_at`,
      { 
        replacements: { 
          name: name.trim(),
          description: description ? description.trim() : null
        }, 
        type: QueryTypes.INSERT 
      }
    );

    // Handle the result properly for PostgreSQL RETURNING clause
    // QueryTypes.INSERT with RETURNING returns an array where first element is the returned row
    const newSubject = Array.isArray(insertResult) ? insertResult[0] : insertResult;

    if (!newSubject) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create subject - no data returned' 
      });
    }

    return res.status(201).json({ 
      success: true, 
      message: 'Subject created successfully',
      data: newSubject
    });
  } catch (error) {
    console.error('Create Subject Error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while creating subject',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = { getAllSubjects, createSubject };

