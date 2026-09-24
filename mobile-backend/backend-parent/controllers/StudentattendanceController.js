const { QueryTypes } = require("sequelize");
const sequelize = require("../../config/db");

function resolveStudentId(req) {
  return (
    req.parent?.id ||
    req.student?.id ||
    req.user?.active_student_id ||
    req.user?.id ||
    null
  );
}

/** YYYY-MM-DD in IST (matches how Indian schools mark attendance). */
function getTodayDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function computeStats(records) {
  const totalDays = records.length;
  const presentDays = records.filter(
    (record) => record.status && record.status.toLowerCase() === "present",
  ).length;
  const absent = records.filter(
    (record) => record.status && record.status.toLowerCase() === "absent",
  ).length;
  const leave = records.filter(
    (record) => record.status && record.status.toLowerCase() === "leave",
  ).length;
  const attendancePercentage =
    totalDays > 0
      ? parseFloat(((presentDays / totalDays) * 100).toFixed(2))
      : 0;

  return {
    totalDays,
    presentDays,
    absent,
    leave,
    attendancePercentage,
  };
}

// -----------------------------
// Individual Student Attendance
// -----------------------------
exports.getStudentAttendance = async (req, res) => {
  try {
    const student_id = resolveStudentId(req);
    if (!student_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Student ID missing",
      });
    }

    const { period, month, year } = req.query;

    const now = new Date();
    const istMonth = Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        month: "numeric",
      }).format(now),
    );
    const istYear = Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
      }).format(now),
    );

    // Summary = all marked days (used by parent dashboard overview)
    if (period === "summary") {
      const allAttendance = await sequelize.query(
        `SELECT date, status FROM attendance WHERE student_id = :student_id ORDER BY date ASC`,
        {
          replacements: { student_id },
          type: QueryTypes.SELECT,
        },
      );

      return res.json({
        success: true,
        attendance: allAttendance,
        stats: computeStats(allAttendance),
      });
    }

    let query = `SELECT date, status FROM attendance WHERE student_id = :student_id`;
    const replacements = { student_id };

    if (period === "daily") {
      query += ` AND date = :today`;
      replacements.today = getTodayDateString();
    } else if (period === "monthly") {
      const m = month ? Number(month) : istMonth;
      const y = year ? Number(year) : istYear;
      query += ` AND EXTRACT(MONTH FROM date) = :month AND EXTRACT(YEAR FROM date) = :year`;
      replacements.month = m;
      replacements.year = y;
    } else if (period === "yearly") {
      const y = year ? Number(year) : istYear;
      query += ` AND EXTRACT(YEAR FROM date) = :year`;
      replacements.year = y;
    }

    query += ` ORDER BY date ASC`;

    const attendance = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });

    return res.json({
      success: true,
      attendance,
      stats: computeStats(attendance),
    });
  } catch (error) {
    console.error("Get Student Attendance Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
