const { QueryTypes } = require("sequelize");
const sequelize = require("../../config/db");

/**
 * Fetch all appointments for a specific school (based on parent session)
 */
exports.getAppointments = async (req, res) => {
  try {
    const school_id = req.parent.school_id;

    if (!school_id) {
      return res.status(400).json({
        success: false,
        message: "School ID not found in session",
      });
    }

    // Fetch appointments for the student's school
    // We assume the table has 'school_id' and 'created_at' columns.
    const appointments = await sequelize.query(
      `SELECT * FROM appointments WHERE school_id = :school_id ORDER BY id DESC`,
      {
        replacements: { school_id },
        type: QueryTypes.SELECT,
      }
    );

    res.json({
      success: true,
      count: appointments.length,
      appointments: appointments,
    });
  } catch (error) {
    console.error("Get Appointments Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching appointments",
    });
  }
};
