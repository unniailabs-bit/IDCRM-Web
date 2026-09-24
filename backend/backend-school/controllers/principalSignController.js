const fs = require("fs");
const path = require("path");
const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");

// CREATE
exports.createPrincipalSign = async (req, res) => {
  try {
    const { school_id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Principal sign file required",
      });
    }

    const signPath = `/uploads/principal_signs/${req.file.filename}`;

    await sequelize.query(
      `UPDATE schools SET principal_sign = :sign WHERE id = :id`,
      {
        replacements: { sign: signPath, id: school_id },
        type: QueryTypes.UPDATE,
      }
    );

    res.status(201).json({
      success: true,
      message: "Principal sign uploaded successfully",
      principal_sign: signPath,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET
exports.getPrincipalSign = async (req, res) => {
  try {
    const { school_id } = req.params;

    const [school] = await sequelize.query(
      `SELECT principal_sign FROM schools WHERE id = :id`,
      {
        replacements: { id: school_id },
        type: QueryTypes.SELECT,
      }
    );

    if (!school?.principal_sign) {
      return res.status(404).json({
        success: false,
        message: "Principal sign not found",
      });
    }

    res.json({
      success: true,
      principal_sign: school.principal_sign,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// UPDATE
exports.updatePrincipalSign = async (req, res) => {
  try {
    const { school_id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Principal sign file required",
      });
    }

    const [school] = await sequelize.query(
      `SELECT principal_sign FROM schools WHERE id = :id`,
      {
        replacements: { id: school_id },
        type: QueryTypes.SELECT,
      }
    );

    // delete old
    if (school?.principal_sign) {
      const oldPath = path.join(__dirname, "../../", school.principal_sign);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const newPath = `/uploads/principal_signs/${req.file.filename}`;

    await sequelize.query(
      `UPDATE schools SET principal_sign = :sign WHERE id = :id`,
      {
        replacements: { sign: newPath, id: school_id },
        type: QueryTypes.UPDATE,
      }
    );

    res.json({
      success: true,
      message: "Principal sign updated successfully",
      principal_sign: newPath,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE
exports.deletePrincipalSign = async (req, res) => {
  try {
    const { school_id } = req.params;

    const [school] = await sequelize.query(
      `SELECT principal_sign FROM schools WHERE id = :id`,
      {
        replacements: { id: school_id },
        type: QueryTypes.SELECT,
      }
    );

    if (!school?.principal_sign) {
      return res.status(404).json({
        success: false,
        message: "Principal sign already deleted",
      });
    }

    const filePath = path.join(__dirname, "../../", school.principal_sign);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await sequelize.query(
      `UPDATE schools SET principal_sign = NULL WHERE id = :id`,
      {
        replacements: { id: school_id },
        type: QueryTypes.UPDATE,
      }
    );

    res.json({
      success: true,
      message: "Principal sign deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
