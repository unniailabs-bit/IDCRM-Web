const { QueryTypes } = require('sequelize');
const sequelize = require('../../config/db');

// ---------------- Get School Dashboard Overview ----------------
const getSchoolDashboardOverview = async (req, res) => {
  try {
    // School admin's school_id is in req.user.school_id
    const schoolId = req.user?.school_id;
    
    if (!schoolId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: School ID missing' });
    }

    // Get total students
    const totalStudents = await sequelize.query(
      `SELECT COUNT(*) as count 
       FROM students 
       WHERE school_id = :school_id`,
      { replacements: { school_id: schoolId }, type: QueryTypes.SELECT }
    );

    // Get new admissions for current year
    const currentYear = new Date().getFullYear();
    const newAdmissions = await sequelize.query(
      `SELECT COUNT(*) as count 
       FROM students 
       WHERE school_id = :school_id 
       AND EXTRACT(YEAR FROM "createdAt") = :current_year`,
      { replacements: { school_id: schoolId, current_year: currentYear }, type: QueryTypes.SELECT }
    );

    // Get total classes
    const totalClasses = await sequelize.query(
      `SELECT COUNT(*) as count 
       FROM classes 
       WHERE school_id = :school_id`,
      { replacements: { school_id: schoolId }, type: QueryTypes.SELECT }
    );

    // Get total divisions
    const totalDivisions = await sequelize.query(
      `SELECT COUNT(*) as count 
       FROM divisions d
       INNER JOIN classes c ON d.class_id = c.id
       WHERE c.school_id = :school_id`,
      { replacements: { school_id: schoolId }, type: QueryTypes.SELECT }
    );

    // Get IDs generated
    const idsGenerated = await sequelize.query(
      `SELECT COUNT(*) as count 
       FROM student_generated_ids 
       WHERE school_id = :school_id`,
      { replacements: { school_id: schoolId }, type: QueryTypes.SELECT }
    );

    // Get credit balance
    const creditBalance = await sequelize.query(
      `SELECT COALESCE(credits, 0) as balance 
       FROM schools 
       WHERE id = :school_id`,
      { replacements: { school_id: schoolId }, type: QueryTypes.SELECT }
    );

    // Get total teachers
    const totalTeachers = await sequelize.query(
      `SELECT COUNT(*) as count 
       FROM teachers 
       WHERE school_id = :school_id AND status = 'Active'`,
      { replacements: { school_id: schoolId }, type: QueryTypes.SELECT }
    );

    // Calculate completion rate
    const studentsCount = parseInt(totalStudents[0]?.count || 0);
    const idsCount = parseInt(idsGenerated[0]?.count || 0);
    const completionRate = studentsCount > 0 ? ((idsCount / studentsCount) * 100).toFixed(1) : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalStudents: parseInt(totalStudents[0]?.count || 0),
        newAdmissions: parseInt(newAdmissions[0]?.count || 0),
        totalClasses: parseInt(totalClasses[0]?.count || 0),
        totalDivisions: parseInt(totalDivisions[0]?.count || 0),
        idsGenerated: idsCount,
        creditBalance: parseInt(creditBalance[0]?.balance || 0),
        totalTeachers: parseInt(totalTeachers[0]?.count || 0),
        completionRate: parseFloat(completionRate),
      }
    });
  } catch (error) {
    console.error('Get School Dashboard Overview Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching dashboard data' });
  }
};

// ---------------- Get Class-wise ID Generation Status ----------------
const getClasswiseIdStatus = async (req, res) => {
  try {
    const schoolId = req.user?.school_id;
    
    if (!schoolId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: School ID missing' });
    }

    const classData = await sequelize.query(
      `SELECT 
         c.class_name as class,
         COUNT(DISTINCT s.id) as students,
         COUNT(DISTINCT sgi.id) as completed
       FROM classes c
       LEFT JOIN divisions d ON d.class_id = c.id
       LEFT JOIN students s ON s.division_id = d.id AND s.school_id = :school_id
       LEFT JOIN student_forms sf ON sf.class_id = c.id AND sf.school_id = :school_id
       LEFT JOIN student_generated_ids sgi ON sgi.student_form_id = sf.id AND sgi.school_id = :school_id
       WHERE c.school_id = :school_id
       GROUP BY c.id, c.class_name
       ORDER BY c.class_name`,
      { replacements: { school_id: schoolId }, type: QueryTypes.SELECT }
    );

    return res.status(200).json({
      success: true,
      data: classData.map(item => ({
        class: item.class,
        students: parseInt(item.students || 0),
        completed: parseInt(item.completed || 0),
      }))
    });
  } catch (error) {
    console.error('Get Class-wise ID Status Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching class-wise data' });
  }
};

// ---------------- Get Quick Stats ----------------
const getQuickStats = async (req, res) => {
  try {
    const schoolId = req.user?.school_id;
    
    if (!schoolId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: School ID missing' });
    }

    // Get pending approvals (forms with pending status)
    const pendingApprovals = await sequelize.query(
      `SELECT COUNT(*) as count 
       FROM student_forms 
       WHERE school_id = :school_id AND status = 'pending'`,
      { replacements: { school_id: schoolId }, type: QueryTypes.SELECT }
    );

    // Get total forms submitted
    const formsSubmitted = await sequelize.query(
      `SELECT COUNT(*) as count 
       FROM student_forms 
       WHERE school_id = :school_id`,
      { replacements: { school_id: schoolId }, type: QueryTypes.SELECT }
    );

    // Get IDs completed this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const completedThisWeek = await sequelize.query(
      `SELECT COUNT(*) as count 
       FROM student_generated_ids 
       WHERE school_id = :school_id 
       AND created_at >= :week_start`,
      { replacements: { school_id: schoolId, week_start: weekStart }, type: QueryTypes.SELECT }
    );

    // Get active teachers
    const activeTeachers = await sequelize.query(
      `SELECT COUNT(*) as count 
       FROM teachers 
       WHERE school_id = :school_id AND status = 'Active'`,
      { replacements: { school_id: schoolId }, type: QueryTypes.SELECT }
    );

    // Get completion rate
    const totalStudents = await sequelize.query(
      `SELECT COUNT(*) as count 
       FROM students 
       WHERE school_id = :school_id`,
      { replacements: { school_id: schoolId }, type: QueryTypes.SELECT }
    );

    const totalIds = await sequelize.query(
      `SELECT COUNT(*) as count 
       FROM student_generated_ids 
       WHERE school_id = :school_id`,
      { replacements: { school_id: schoolId }, type: QueryTypes.SELECT }
    );

    const studentsCount = parseInt(totalStudents[0]?.count || 0);
    const idsCount = parseInt(totalIds[0]?.count || 0);
    const completionRate = studentsCount > 0 ? ((idsCount / studentsCount) * 100).toFixed(1) : 0;

    return res.status(200).json({
      success: true,
      data: {
        pendingApprovals: parseInt(pendingApprovals[0]?.count || 0),
        formsSubmitted: parseInt(formsSubmitted[0]?.count || 0),
        completedThisWeek: parseInt(completedThisWeek[0]?.count || 0),
        activeTeachers: parseInt(activeTeachers[0]?.count || 0),
        completionRate: parseFloat(completionRate),
      }
    });
  } catch (error) {
    console.error('Get Quick Stats Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching quick stats' });
  }
};

// ---------------- Get Recent Activity ----------------
const getRecentActivity = async (req, res) => {
  try {
    const schoolId = req.user?.school_id;
    
    if (!schoolId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: School ID missing' });
    }

    // Get recent form submissions grouped by class and division
    const recentForms = await sequelize.query(
      `SELECT 
         c.class_name,
         d.division_name,
         t.name as teacher_name,
         COUNT(sf.id) as form_count,
         MAX(sf.created_at) as latest_submission,
         sf.status
       FROM student_forms sf
       INNER JOIN classes c ON sf.class_id = c.id
       LEFT JOIN divisions d ON d.class_id = c.id
       LEFT JOIN teachers t ON sf.teacher_id = t.id
       WHERE sf.school_id = :school_id AND c.school_id = :school_id
       GROUP BY c.class_name, d.division_name, t.name, sf.status
       ORDER BY latest_submission DESC
       LIMIT 10`,
      { replacements: { school_id: schoolId }, type: QueryTypes.SELECT }
    );

    // Get recent ID generation activities
    const recentIdGeneration = await sequelize.query(
      `SELECT 
         c.class_name,
         d.division_name,
         COUNT(sgi.id) as id_count,
         MAX(sgi.created_at) as latest_generation
       FROM student_generated_ids sgi
       INNER JOIN student_forms sf ON sgi.student_form_id = sf.id
       INNER JOIN classes c ON sf.class_id = c.id
       LEFT JOIN divisions d ON d.class_id = c.id
       WHERE sgi.school_id = :school_id AND c.school_id = :school_id
       GROUP BY c.class_name, d.division_name
       ORDER BY latest_generation DESC
       LIMIT 5`,
      { replacements: { school_id: schoolId }, type: QueryTypes.SELECT }
    );

    // Format activity data
    const activities = [];
    
    // Add form submission activities
    recentForms.forEach((item, index) => {
      const timeAgo = getTimeAgo(new Date(item.latest_submission));
      activities.push({
        id: `form-${index}`,
        activity: `${item.class_name}${item.division_name ? '-' + item.division_name : ''} forms ${item.status === 'approved' ? 'approved' : 'submitted'}`,
        teacher: item.teacher_name || 'N/A',
        count: parseInt(item.form_count || 0),
        status: item.status === 'approved' ? 'Completed' : item.status === 'pending' ? 'Pending Approval' : 'In Progress',
        time: timeAgo,
      });
    });

    // Add ID generation activities
    recentIdGeneration.forEach((item, index) => {
      const timeAgo = getTimeAgo(new Date(item.latest_generation));
      activities.push({
        id: `id-${index}`,
        activity: `${item.class_name}${item.division_name ? '-' + item.division_name : ''} ID generation completed`,
        teacher: 'N/A',
        count: parseInt(item.id_count || 0),
        status: 'Completed',
        time: timeAgo,
      });
    });

    // Sort by time and limit to 10 most recent
    activities.sort((a, b) => {
      const timeA = parseTimeAgo(a.time);
      const timeB = parseTimeAgo(b.time);
      return timeA - timeB;
    });

    return res.status(200).json({
      success: true,
      data: activities.slice(0, 10)
    });
  } catch (error) {
    console.error('Get Recent Activity Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching recent activity' });
  }
};

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// Helper function to parse time ago for sorting
function parseTimeAgo(timeStr) {
  if (timeStr.includes('minute')) {
    return parseInt(timeStr) * 60000;
  } else if (timeStr.includes('hour')) {
    return parseInt(timeStr) * 3600000;
  } else if (timeStr.includes('day')) {
    return parseInt(timeStr) * 86400000;
  }
  return 0;
}

module.exports = {
  getSchoolDashboardOverview,
  getClasswiseIdStatus,
  getQuickStats,
  getRecentActivity,
};

