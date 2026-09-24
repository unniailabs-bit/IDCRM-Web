const Student = require("../models/Student"); 

// GET /api/teacher/students
exports.getStudents = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const class_id = req.user.class_id;
    const division_id = req.user.division_id;

    if (!school_id || !class_id || !division_id) {
      return res.status(400).json({ success: false, message: "Invalid token data" });
    }

    // ✅ Use correct model name
    const students = await Student.findAll({
      where: { school_id, class_id, division_id },
      order: [["roll_number", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
