const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");

// ===================================
// STUDENT → RAISE HELP DESK TICKET
// ===================================
exports.raiseTicket = async (req, res) => {
  try {
    const student = req.parent; // from parentAuth

    if (!student || !student.id || !student.school_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Student not found"
      });
    }

    const { category, subject, description } = req.body;

    if (!category || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: "Category, subject and description are required"
      });
    }

    // Optional image
    const attachment = req.file
      ? `/uploads/helpdesk/${req.file.filename}`
      : null;

    await sequelize.query(
      `
      INSERT INTO helpdesk_tickets
      (student_id, school_id, category, subject, description, attachment)
      VALUES
      (:student_id, :school_id, :category, :subject, :description, :attachment)
      `,
      {
        replacements: {
          student_id: student.id,
          school_id: student.school_id,
          category,
          subject,
          description,
          attachment
        },
        type: QueryTypes.INSERT
      }
    );

    return res.status(201).json({
      success: true,
      message: "Ticket raised successfully"
    });

  } catch (error) {
    console.error("Raise Ticket Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

// ===================================
// STUDENT → GET MY TICKETS
// ===================================
exports.getMyTickets = async (req, res) => {
  try {
    const student = req.parent; // from parentAuth

    if (!student || !student.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Student not found"
      });
    }

    const baseUrl =
      process.env.BACKEND_URL ||
      `${req.protocol}://${req.get("host")}`;

    const tickets = await sequelize.query(
      `
      SELECT * 
      FROM helpdesk_tickets 
      WHERE student_id = :student_id
      ORDER BY created_at DESC
      `,
      {
        replacements: { student_id: student.id },
        type: QueryTypes.SELECT
      }
    );

    const result = tickets.map(ticket => ({
      ...ticket,
      attachment: ticket.attachment ? `${baseUrl}${ticket.attachment}` : null
    }));

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });

  } catch (error) {
    console.error("Get My Tickets Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};
