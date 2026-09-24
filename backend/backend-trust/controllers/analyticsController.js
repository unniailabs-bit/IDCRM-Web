const { QueryTypes } = require('sequelize');
const sequelize = require('../../config/db');

// ---------------- Get Analytics Overview ----------------
const getAnalyticsOverview = async (req, res) => {
  try {
    const trustId = req.user?.id;
    
    if (!trustId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Trust ID missing' });
    }

    // Get total students across all schools in the trust
    const totalStudents = await sequelize.query(
      `SELECT COUNT(*) as count 
       FROM students s
       INNER JOIN schools sch ON s.school_id = sch.id
       WHERE sch.trust_id = :trust_id`,
      { replacements: { trust_id: trustId }, type: QueryTypes.SELECT }
    );

    // Get trust's current credit balance
    const trust = await sequelize.query(
      `SELECT credit FROM trusts WHERE id = :trust_id`,
      { replacements: { trust_id: trustId }, type: QueryTypes.SELECT }
    );

    const trustCredits = parseInt(trust[0]?.credit || 0, 10);

    // Get total ID cards generated
    const totalIdCards = await sequelize.query(
      `SELECT COUNT(*) as count 
       FROM student_generated_ids sgi
       INNER JOIN schools sch ON sgi.school_id = sch.id
       WHERE sch.trust_id = :trust_id`,
      { replacements: { trust_id: trustId }, type: QueryTypes.SELECT }
    );

    // Get total credits used (from student_generated_ids)
    const creditsUsed = await sequelize.query(
      `SELECT COALESCE(SUM(sgi.credits_deducted), 0) as total 
       FROM student_generated_ids sgi
       INNER JOIN schools sch ON sgi.school_id = sch.id
       WHERE sch.trust_id = :trust_id`,
      { replacements: { trust_id: trustId }, type: QueryTypes.SELECT }
    );

    const totalCreditsUsed = parseInt(creditsUsed[0]?.total || 0, 10);
    const totalCreditsAllocated = trustCredits + totalCreditsUsed; // Total allocated = current + used

    // Get total schools
    const totalSchools = await sequelize.query(
      `SELECT COUNT(*) as count 
       FROM schools 
       WHERE trust_id = :trust_id`,
      { replacements: { trust_id: trustId }, type: QueryTypes.SELECT }
    );

    // Get total teachers
    const totalTeachers = await sequelize.query(
      `SELECT COUNT(*) as count 
       FROM teachers t
       INNER JOIN schools sch ON t.school_id = sch.id
       WHERE sch.trust_id = :trust_id`,
      { replacements: { trust_id: trustId }, type: QueryTypes.SELECT }
    );

    // Calculate success rate (ID cards generated / total students)
    const studentsCount = parseInt(totalStudents[0]?.count || 0);
    const idCardsCount = parseInt(totalIdCards[0]?.count || 0);
    const successRate = studentsCount > 0 ? ((idCardsCount / studentsCount) * 100).toFixed(1) : 0;

    // Get previous month data for comparison
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const lastMonthStudents = await sequelize.query(
      `SELECT COUNT(*) as count 
       FROM students s
       INNER JOIN schools sch ON s.school_id = sch.id
       WHERE sch.trust_id = :trust_id AND s."createdAt" < :last_month`,
      { replacements: { trust_id: trustId, last_month: lastMonth }, type: QueryTypes.SELECT }
    );

    const lastMonthIdCards = await sequelize.query(
      `SELECT COUNT(*) as count 
       FROM student_generated_ids sgi
       INNER JOIN schools sch ON sgi.school_id = sch.id
       WHERE sch.trust_id = :trust_id AND sgi.created_at < :last_month`,
      { replacements: { trust_id: trustId, last_month: lastMonth }, type: QueryTypes.SELECT }
    );

    const lastMonthStudentsCount = parseInt(lastMonthStudents[0]?.count || 0);
    const lastMonthIdCardsCount = parseInt(lastMonthIdCards[0]?.count || 0);
    
    const studentsGrowth = lastMonthStudentsCount > 0 
      ? (((studentsCount - lastMonthStudentsCount) / lastMonthStudentsCount) * 100).toFixed(1)
      : 0;
    
    const idCardsGrowth = lastMonthIdCardsCount > 0
      ? (((idCardsCount - lastMonthIdCardsCount) / lastMonthIdCardsCount) * 100).toFixed(1)
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalStudents: studentsCount,
        totalIdCards: idCardsCount,
        creditBalance: trustCredits, // Current trust credit balance
        creditsUsed: totalCreditsUsed, // Total credits used for ID generation
        creditsAllocated: totalCreditsAllocated, // Total allocated = current + used
        creditsRemaining: trustCredits, // Remaining credits = current balance
        totalSchools: parseInt(totalSchools[0]?.count || 0),
        totalTeachers: parseInt(totalTeachers[0]?.count || 0),
        successRate: parseFloat(successRate),
        studentsGrowth: parseFloat(studentsGrowth),
        idCardsGrowth: parseFloat(idCardsGrowth),
      }
    });
  } catch (error) {
    console.error('Get Analytics Overview Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching analytics' });
  }
};

// ---------------- Get Monthly Trends ----------------
const getMonthlyTrends = async (req, res) => {
  try {
    const trustId = req.user?.id;
    
    if (!trustId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Trust ID missing' });
    }

    // Get last 6 months of data
    const monthlyData = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      const monthName = months[date.getMonth()];

      // Get students for this month (using createdAt camelCase)
      const students = await sequelize.query(
        `SELECT COUNT(*) as count 
         FROM students s
         INNER JOIN schools sch ON s.school_id = sch.id
         WHERE sch.trust_id = :trust_id 
         AND s."createdAt" >= :month_start 
         AND s."createdAt" <= :month_end`,
        { 
          replacements: { trust_id: trustId, month_start: monthStart, month_end: monthEnd }, 
          type: QueryTypes.SELECT 
        }
      );

      // Get ID cards for this month
      const idCards = await sequelize.query(
        `SELECT COUNT(*) as count 
         FROM student_generated_ids sgi
         INNER JOIN schools sch ON sgi.school_id = sch.id
         WHERE sch.trust_id = :trust_id 
         AND sgi.created_at >= :month_start 
         AND sgi.created_at <= :month_end`,
        { 
          replacements: { trust_id: trustId, month_start: monthStart, month_end: monthEnd }, 
          type: QueryTypes.SELECT 
        }
      );

      // Get credits used for this month (from student_generated_ids)
      const credits = await sequelize.query(
        `SELECT COALESCE(SUM(credits_deducted), 0) as total 
         FROM student_generated_ids sgi
         INNER JOIN schools sch ON sgi.school_id = sch.id
         WHERE sch.trust_id = :trust_id 
         AND sgi.created_at >= :month_start 
         AND sgi.created_at <= :month_end`,
        { 
          replacements: { trust_id: trustId, month_start: monthStart, month_end: monthEnd }, 
          type: QueryTypes.SELECT 
        }
      );

      monthlyData.push({
        month: monthName,
        students: parseInt(students[0]?.count || 0),
        idCards: parseInt(idCards[0]?.count || 0),
        credits: parseInt(credits[0]?.total || 0),
      });
    }

    return res.status(200).json({
      success: true,
      data: monthlyData
    });
  } catch (error) {
    console.error('Get Monthly Trends Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching monthly trends' });
  }
};

// ---------------- Get School Performance ----------------
const getSchoolPerformance = async (req, res) => {
  try {
    const trustId = req.user?.id;
    
    if (!trustId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Trust ID missing' });
    }

    const schoolPerformance = await sequelize.query(
      `SELECT 
         sch.id,
         sch.school_name as school,
         COUNT(DISTINCT s.id) as students,
         COUNT(DISTINCT sgi.id) as idCards,
         COALESCE(SUM(sgi.credits_deducted), 0) as creditsUsed
       FROM schools sch
       LEFT JOIN students s ON s.school_id = sch.id
       LEFT JOIN student_generated_ids sgi ON sgi.school_id = sch.id
       WHERE sch.trust_id = :trust_id
       GROUP BY sch.id, sch.school_name
       ORDER BY students DESC
       LIMIT 10`,
      { replacements: { trust_id: trustId }, type: QueryTypes.SELECT }
    );

    return res.status(200).json({
      success: true,
      data: schoolPerformance.map(school => ({
        school: school.school,
        students: parseInt(school.students || 0),
        creditsUsed: parseInt(school.creditsUsed || 0),
        idCards: parseInt(school.idCards || 0),
      }))
    });
  } catch (error) {
    console.error('Get School Performance Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching school performance' });
  }
};

// ---------------- Get Credit Distribution ----------------
const getCreditDistribution = async (req, res) => {
  try {
    const trustId = req.user?.id;
    
    if (!trustId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Trust ID missing' });
    }

    // Get trust's current credit balance
    const trust = await sequelize.query(
      `SELECT credit FROM trusts WHERE id = :trust_id`,
      { replacements: { trust_id: trustId }, type: QueryTypes.SELECT }
    );

    const remainingCredits = parseInt(trust[0]?.credit || 0, 10);

    // Get used credits (from student_generated_ids)
    const usedCredits = await sequelize.query(
      `SELECT COALESCE(SUM(sgi.credits_deducted), 0) as total 
       FROM student_generated_ids sgi
       INNER JOIN schools sch ON sgi.school_id = sch.id
       WHERE sch.trust_id = :trust_id`,
      { replacements: { trust_id: trustId }, type: QueryTypes.SELECT }
    );

    const used = parseInt(usedCredits[0]?.total || 0, 10);
    const allocated = remainingCredits + used; // Total allocated = remaining + used

    return res.status(200).json({
      success: true,
      data: [
        { name: 'Used', value: used, color: '#f97316' },
        { name: 'Remaining', value: remainingCredits, color: '#22c55e' },
      ],
      summary: {
        allocated: allocated,
        used: used,
        remaining: remainingCredits,
      }
    });
  } catch (error) {
    console.error('Get Credit Distribution Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching credit distribution' });
  }
};

// ---------------- Get ID Card Status ----------------
const getIdCardStatus = async (req, res) => {
  try {
    const trustId = req.user?.id;
    
    if (!trustId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Trust ID missing' });
    }

    // Get generated ID cards
    const generated = await sequelize.query(
      `SELECT COUNT(*) as count 
       FROM student_generated_ids sgi
       INNER JOIN schools sch ON sgi.school_id = sch.id
       WHERE sch.trust_id = :trust_id`,
      { replacements: { trust_id: trustId }, type: QueryTypes.SELECT }
    );

    // Get pending (students without ID cards)
    const pending = await sequelize.query(
      `SELECT COUNT(*) as count 
       FROM students s
       INNER JOIN schools sch ON s.school_id = sch.id
       LEFT JOIN student_generated_ids sgi ON sgi.student_form_id = s.id
       WHERE sch.trust_id = :trust_id AND sgi.id IS NULL`,
      { replacements: { trust_id: trustId }, type: QueryTypes.SELECT }
    );

    // Get rejected (forms with rejected status)
    const rejected = await sequelize.query(
      `SELECT COUNT(DISTINCT sf.id) as count 
       FROM student_forms sf
       INNER JOIN schools sch ON sf.school_id = sch.id
       WHERE sch.trust_id = :trust_id 
       AND sf.status = 'rejected'`,
      { replacements: { trust_id: trustId }, type: QueryTypes.SELECT }
    );

    const generatedCount = parseInt(generated[0]?.count || 0);
    const pendingCount = parseInt(pending[0]?.count || 0);
    const rejectedCount = parseInt(rejected[0]?.count || 0);

    return res.status(200).json({
      success: true,
      data: [
        { name: 'Generated', value: generatedCount, color: '#3b82f6' },
        { name: 'Pending', value: pendingCount, color: '#eab308' },
        { name: 'Rejected', value: rejectedCount, color: '#ef4444' },
      ]
    });
  } catch (error) {
    console.error('Get ID Card Status Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching ID card status' });
  }
};

// ---------------- Get Recent Activity ----------------
const getRecentActivity = async (req, res) => {
  try {
    const trustId = req.user?.id;
    
    if (!trustId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Trust ID missing' });
    }

    // Get recent ID card generation activity grouped by school
    const recentActivity = await sequelize.query(
      `SELECT 
         sch.school_name as school,
         COUNT(sgi.id) as id_cards,
         SUM(sgi.credits_deducted) as credits_used,
         MAX(sgi.created_at) as last_activity
       FROM student_generated_ids sgi
       INNER JOIN schools sch ON sgi.school_id = sch.id
       WHERE sch.trust_id = :trust_id
       GROUP BY sch.id, sch.school_name, DATE(sgi.created_at)
       ORDER BY MAX(sgi.created_at) DESC
       LIMIT 10`,
      { replacements: { trust_id: trustId }, type: QueryTypes.SELECT }
    );

    return res.status(200).json({
      success: true,
      data: recentActivity.map((activity, index) => ({
        id: `activity-${index}`,
        school: activity.school,
        action: `Generated ${activity.id_cards} ID cards`,
        date: new Date(activity.last_activity).toLocaleString('en-IN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
        credits: parseInt(activity.credits_used || 0, 10),
      }))
    });
  } catch (error) {
    console.error('Get Recent Activity Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching recent activity' });
  }
};

module.exports = {
  getAnalyticsOverview,
  getMonthlyTrends,
  getSchoolPerformance,
  getCreditDistribution,
  getIdCardStatus,
  getRecentActivity,
};

