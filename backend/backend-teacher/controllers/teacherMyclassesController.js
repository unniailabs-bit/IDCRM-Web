const { QueryTypes } = require('sequelize');
const sequelize = require('../../config/db');

exports.getTeacherDashboard = async (req, res) => {
  try {
    const teacherId = req.user?.id;

    if (!teacherId) {
      return res.status(400).json({ success: false, message: "Teacher info missing in JWT" });
    }

    //  Fetch teacher details
    const teachers = await sequelize.query(
      'SELECT * FROM teachers WHERE id = :teacherId',
      { replacements: { teacherId }, type: QueryTypes.SELECT }
    );

    const teacher = teachers[0];
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    // Fetch divisions assigned to this teacher
    const divisions = await sequelize.query(
      `SELECT id AS division_id, division_name, class_name, class_id
       FROM divisions
       WHERE teacher_id = :teacherId`,
      { replacements: { teacherId }, type: QueryTypes.SELECT }
    );

    //  For each division, count students with breakdown
    const divisionsWithCount = await Promise.all(divisions.map(async (div) => {
      // We use SUM(CASE...) to get counts for specific statuses in one query
      const statsResult = await sequelize.query(
        `SELECT 
           COUNT(*) AS total_count,
           SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
           SUM(CASE WHEN status != 'approved' OR status IS NULL THEN 1 ELSE 0 END) AS pending_count
         FROM student_forms 
         WHERE division_id = :divisionId`,
        { replacements: { divisionId: div.division_id }, type: QueryTypes.SELECT }
      );

      const stats = statsResult[0];

      return {
        division_id: div.division_id,
        division_name: div.division_name,
        class_name: div.class_name,
        class_id: div.class_id, // Added class_id to output
        student_count: parseInt(stats.total_count || 0, 10),
        approved_count: parseInt(stats.approved_count || 0, 10),
        pending_count: parseInt(stats.pending_count || 0, 10),
      };
    }));

    // -------------------------------------------------------------------------
    // NEW LOGIC: Calculate stats dependent on teacher_id from student_forms
    // Support filtering by class_id and division_id
    // -------------------------------------------------------------------------

    const { class_id, division_id } = req.query;
    const replacements = { teacherId };
    let filterClause = "";

    if (class_id) {
      filterClause += " AND class_id = :class_id";
      replacements.class_id = class_id;
    }
    if (division_id) {
      filterClause += " AND division_id = :division_id";
      replacements.division_id = division_id;
    }

    // 1. Total Students (belonging to this teacher + filters)
    const totalStudentsData = await sequelize.query(
      `SELECT COUNT(*) AS count 
       FROM student_forms 
       WHERE teacher_id = :teacherId ${filterClause}`,
      {
        replacements,
        type: QueryTypes.SELECT,
      }
    );
    const totalStudents = parseInt(totalStudentsData[0]?.count || 0, 10);

    // 2. Forms Received (Same as total students if every student has a form)
    const formsReceived = totalStudents;

    // 3. Approved Forms
    const approvedFormsData = await sequelize.query(
      `SELECT COUNT(*) AS count 
       FROM student_forms 
       WHERE teacher_id = :teacherId 
       AND status = 'approved' ${filterClause}`,
      {
        replacements,
        type: QueryTypes.SELECT,
      }
    );
    const approvedForms = parseInt(approvedFormsData[0]?.count || 0, 10);

    // 4. Pending Forms (Total - Approved)
    //    Alternatively, you could query where status = 'submitted' or status != 'approved'
    const pendingForms = formsReceived - approvedForms;

    // Return response
    return res.json({
      success: true,
      data: {
        teacherName: teacher.name,
        teacherId: teacher.id,
        // The requester asked for: 
        // "total students belongs to teacher id, forms reciverd, approved and pending"
        metrics: {
          totalStudents,
          formsReceived,
          approvedForms,
          pendingForms,
        },
        // We keep the divisions data if it's still needed, or we can remove it if purely stats are requested.
        // Assuming we still might want the breakdown, but if not, the metrics above are the priority.
        // For now, I'll return the metrics at the top level as well for easier access if that's what the UI expects,
        // or map them to the existing structure if needed. 
        // Let's provide a flat structure matching the likely UI needs along with the previous 'divisions' data if feasible.

        // Overwriting previous totalStudents which was school-wide, with teacher-specific count
        // totalStudents,
        // formsReceived,
        // approvedForms,
        // pendingForms,

        divisions: divisionsWithCount,
      },
    });

  } catch (error) {
    console.error('🔥 Error in getTeacherDashboard:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getTeacherClassesList = async (req, res) => {
  try {
    const teacherId = req.user?.id;

    if (!teacherId) {
      return res.status(400).json({ success: false, message: "Teacher info missing in JWT" });
    }

    const classes = await sequelize.query(
      `SELECT id, division_name, class_name, class_id 
       FROM divisions 
       WHERE teacher_id = :teacherId`,
      { replacements: { teacherId }, type: QueryTypes.SELECT }
    );

    return res.json({
      success: true,
      data: classes
    });

  } catch (error) {
    console.error('Error in getTeacherClassesList:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
