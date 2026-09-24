import { QueryTypes } from "sequelize";
import sequelize from "../../config/db.js";
import twilio from "twilio";

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Share Form Link Controller
export const shareFormLink = async (req, res) => {
  try {
    //  Validate teacher identity from JWT
    const teacherId = req.user?.id;
    if (!teacherId)
      return res
        .status(400)
        .json({ success: false, message: "Teacher ID missing in token" });

    //  Get teacher details
    const teacher = await sequelize.query(
      `SELECT * FROM teachers WHERE id = :id`,
      { replacements: { id: teacherId }, type: QueryTypes.SELECT }
    );
    if (!teacher.length)
      return res
        .status(404)
        .json({ success: false, message: "Teacher not found" });

    const teacherData = teacher[0];

    //  Get assigned class
    const assignedClass = await sequelize.query(
      `SELECT * FROM classes WHERE class_teacher = :teacherName AND school_id = :schoolId`,
      {
        replacements: { teacherName: teacherData.name, schoolId: teacherData.school_id },
        type: QueryTypes.SELECT,
      }
    );
    if (!assignedClass.length)
      return res.status(404).json({
        success: false,
        message: "No class assigned to this teacher",
      });

    const classData = assignedClass[0];

    //  Get students in that class
    const students = await sequelize.query(
      `SELECT id, name, parent_phone 
       FROM students 
       WHERE class_id = :classId`,
      { replacements: { classId: classData.id }, type: QueryTypes.SELECT }
    );

    if (!students.length)
      return res.status(404).json({
        success: false,
        message: "No students found for this class",
      });

    //  Send WhatsApp messages
    const sendResults = [];

    for (const student of students) {
      const formLink = `https://yourfrontend.com/student-form/${student.id}`;

      if (!student.parent_phone) {
        sendResults.push({
          student: student.name,
          status: "skipped",
          note: "Parent phone number missing",
        });
        continue;
      }

      const message = `Hello Parent ,

This is a reminder from *${teacherData.name}*, your child’s class teacher.
Please fill out the student information form for *${student.name}*.
Form Link: ${formLink}

Thank you for your cooperation!`;

      try {
        const msgResponse = await client.messages.create({
          from: process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886",
          to: `whatsapp:${student.parent_phone}`,
          body: message,
        });

        sendResults.push({
          student: student.name,
          phone: student.parent_phone,
          status: "sent",
          sid: msgResponse.sid,
        });
      } catch (sendErr) {
        sendResults.push({
          student: student.name,
          phone: student.parent_phone,
          status: "failed",
          error: sendErr.message,
        });
      }
    }

    //  Return summary
    return res.json({
      success: true,
      message: "Form links shared successfully via WhatsApp",
      data: sendResults,
    });
  } catch (error) {
    console.error(" Error in shareFormLink:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
