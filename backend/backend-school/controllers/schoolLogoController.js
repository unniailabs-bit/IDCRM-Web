const fs = require("fs");
const path = require("path");
const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");

/**
 * CREATE - POST
 */
exports.createSchoolLogo = async (req, res) => {
  try {
    const { school_id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Logo file required",
      });
    }

    const logoPath = `/uploads/school_logos/${req.file.filename}`;

    await sequelize.query(
      `UPDATE schools SET logo = :logo WHERE id = :id`,
      {
        replacements: { logo: logoPath, id: school_id },
        type: QueryTypes.UPDATE,
      }
    );

    res.status(201).json({
      success: true,
      message: "School logo created successfully",
      logo: logoPath,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * READ - GET
 */
exports.getSchoolLogo = async (req, res) => {
  try {
    const { school_id } = req.params;

    const [school] = await sequelize.query(
      `SELECT logo FROM schools WHERE id = :id`,
      {
        replacements: { id: school_id },
        type: QueryTypes.SELECT,
      }
    );

    if (!school || !school.logo) {
      return res.status(404).json({
        success: false,
        message: "Logo not found",
      });
    }

    res.json({
      success: true,
      logo: school.logo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * UPDATE - PATCH
 */
exports.updateSchoolLogo = async (req, res) => {
  try {
    const { school_id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Logo file required",
      });
    }

    // 🔹 Get old logo
    const [school] = await sequelize.query(
      `SELECT logo FROM schools WHERE id = :id`,
      {
        replacements: { id: school_id },
        type: QueryTypes.SELECT,
      }
    );

    // 🔹 Delete old file
    if (school?.logo) {
      const oldPath = path.join(__dirname, "../../", school.logo);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const newLogoPath = `/uploads/school_logos/${req.file.filename}`;

    await sequelize.query(
      `UPDATE schools SET logo = :logo WHERE id = :id`,
      {
        replacements: { logo: newLogoPath, id: school_id },
        type: QueryTypes.UPDATE,
      }
    );

    res.json({
      success: true,
      message: "School logo updated successfully",
      logo: newLogoPath,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * DELETE
 */
exports.deleteSchoolLogo = async (req, res) => {
  try {
    const { school_id } = req.params;

    const [school] = await sequelize.query(
      `SELECT logo FROM schools WHERE id = :id`,
      {
        replacements: { id: school_id },
        type: QueryTypes.SELECT,
      }
    );

    if (!school || !school.logo) {
      return res.status(404).json({
        success: false,
        message: "Logo already deleted",
      });
    }

    const filePath = path.join(__dirname, "../../", school.logo);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await sequelize.query(
      `UPDATE schools SET logo = NULL WHERE id = :id`,
      {
        replacements: { id: school_id },
        type: QueryTypes.UPDATE,
      }
    );

    res.json({
      success: true,
      message: "School logo deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
