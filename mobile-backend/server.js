const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");

const path = require("path");

dotenv.config();

const app = express();

// Trust proxy for correct protocol detection (HTTP/HTTPS) behind load balancers
app.enable("trust proxy");

// Middlewares
app.use(cors());
app.use(express.json());

// Serve static files from 'uploads' directory with fallback support
app.use("/uploads", (req, res, next) => {
  // Remove leading slash from path if present
  let filePath = req.path.startsWith('/') ? req.path.substring(1) : req.path;

  // Try main uploads directory first
  const mainPath = path.join(__dirname, "uploads", filePath);
  if (fs.existsSync(mainPath) && fs.statSync(mainPath).isFile()) {
    return res.sendFile(mainPath);
  }

  // Fallback to backend-teacher/uploads
  const fallbackPath = path.join(__dirname, "backend-teacher/uploads", filePath);
  if (fs.existsSync(fallbackPath) && fs.statSync(fallbackPath).isFile()) {
    return res.sendFile(fallbackPath);
  }

  // Fallback to Web Backend (IDCRM Credit) uploads folder (so App can read web's images)
  // Define this path in your .env file on the live server. Default is the local relative path.
  const idcrmUploadsFolder = process.env.IDCRM_UPLOADS_PATH || path.join(__dirname, "../backend/uploads");
  const idcrmPath = path.join(idcrmUploadsFolder, filePath);

  if (fs.existsSync(idcrmPath) && fs.statSync(idcrmPath).isFile()) {
    return res.sendFile(idcrmPath);
  }

  // File not found
  res.status(404).json({ success: false, message: "File not found" });
});

// 👉 Direct auth route import

const authroutes = require('./backend-teacher/routes/authroutes');
const homeworkRoutes = require("./backend-teacher/routes/homeworkRoutes");
const materialRoutes = require("./backend-teacher/routes/materialRoutes");
const formLinkRoutes = require('./backend-teacher/routes/formLinkRoutes');
const teacherStudentFormsRoutes = require('./backend-teacher/routes/teacherStudentFormsRoutes');
const attendanceRoutes = require('./backend-teacher/routes/attendanceRoutes');
const attendanceSummaryRoutes = require("./backend-teacher/routes/attendanceSummaryRoutes");
const mcqRoutes = require("./backend-teacher/routes/mcqRoutes");
const subjectRoutes = require("./backend-teacher/routes/subjectRoutes");
const parentRoutes = require("./backend-parent/routes/parentRoutes");
const mcqparentRoutes = require("./backend-parent/routes/mcqparentRoutes");
const StudentattendanceRoutes = require("./backend-parent/routes/StudentattendanceRoutes");
const studentMaterialRoutes = require("./backend-parent/routes/studentMaterialRoutes");
const studentMcqPracticeRoutes = require("./backend-parent/routes/studentMcqPracticeRoutes");
const studentMessageRoutes = require("./backend-parent/routes/studentMessageRoutes");
const teacherMessageRoutes = require("./backend-teacher/routes/teacherMessageRoutes");
const teacherStoryRoutes = require("./backend-teacher/routes/teacherStoryRoutes");
const studentStoryRoutes = require("./backend-parent/routes/studentStoryRoutes");
const QrcodeRoutes = require("./backend-parent/routes/QrcodeRoutes");
const eventGalleryRoutes = require("./backend-teacher/routes/eventGalleryRoutes");
const teacherCertificatesRoutes = require("./backend-teacher/routes/teacherCertificatesRoutes");
const teacherAwardsRoutes = require("./backend-teacher/routes/teacherAwardsRoutes");
const certificateRoutes = require("./backend-parent/routes/certificateRoutes");
const studentAwardRoutes = require("./backend-parent/routes/studentAwardRoutes");
const studentEventRoutes = require("./backend-parent/routes/studentEventRoutes");
const studentAppointmentRoutes = require("./backend-parent/routes/studentAppointmentRoutes");
const helpdeskRoutes = require("./backend-parent/routes/helpdeskRoutes");
const teacherTimetableRoutes = require("./backend-teacher/routes/teacherTimetableRoutes");
const studentExamRoutes = require("./backend-parent/routes/studentExamRoutes");
const studentNotificationRoutes = require("./backend-parent/routes/studentNotificationRoutes");
const studentFeeRoutes = require("./backend-parent/routes/studentFeeRoutes");
const teacherNotificationRoutes = require("./backend-teacher/routes/notificationRoutes");
const schoolCalendarRoutes = require("./backend-teacher/routes/schoolCalendarRoutes");
const schoolCalendarParentRoutes = require("./backend-parent/routes/schoolCalendarRoutes");
const schoolTimetableRoutes = require("./backend-teacher/routes/schoolTimetableRoutes");
const studentSchoolTimetableRoutes = require("./backend-parent/routes/studentSchoolTimetableRoutes");
const teacherFcmRoutes = require("./backend-teacher/routes/fcmRoutes");
const parentFcmRoutes = require("./backend-parent/routes/fcmRoutes");

// Direct mount
app.use("/api/teacher/auth", authroutes);
app.use('/api/teacher/upload', homeworkRoutes);
app.use('/api/teacher/', materialRoutes)
app.use('/api/form-links', formLinkRoutes);
app.use('/api/teacher/student-forms', teacherStudentFormsRoutes);
app.use('/api/teacher', attendanceRoutes);
app.use("/api/teacher", attendanceSummaryRoutes);
app.use("/api/teacher", mcqRoutes);
app.use("/api/teacher", subjectRoutes);
app.use("/api/parent/", parentRoutes);
app.use("/api/parent/", mcqparentRoutes);
app.use("/api/parent/", StudentattendanceRoutes);
app.use("/api/parent/", studentMaterialRoutes);
app.use("/api/student/", studentMcqPracticeRoutes);
app.use("/api/student/", studentMessageRoutes);
app.use("/api/teacher/", teacherMessageRoutes);
app.use("/api/teacher/", teacherStoryRoutes);
app.use("/api/student/", helpdeskRoutes);
app.use("/api/student", studentStoryRoutes);
app.use("/api/student", QrcodeRoutes);
app.use("/api/teacher/", eventGalleryRoutes);
app.use("/api/teacher/", teacherCertificatesRoutes);
app.use("/api/teacher/", teacherAwardsRoutes);
app.use("/api/parent/", certificateRoutes);
app.use("/api/parent/", studentAwardRoutes);
app.use("/api/parent/", studentEventRoutes);
app.use("/api/parent/appointments", studentAppointmentRoutes);
app.use("/api/teacher/", teacherTimetableRoutes);
app.use("/api/parent/", studentExamRoutes);
app.use("/api/parent/", studentNotificationRoutes);
app.use("/api/parent/", studentFeeRoutes);
app.use("/api/teacher/", teacherNotificationRoutes);
app.use("/api/teacher/", schoolCalendarRoutes);
app.use("/api/parent/", schoolCalendarParentRoutes);
app.use("/api/teacher/", schoolTimetableRoutes);
app.use("/api/parent/", studentSchoolTimetableRoutes);
app.use("/api/teacher/fcm", teacherFcmRoutes);
app.use("/api/parent/fcm", parentFcmRoutes);


// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Teacher backend running 🚀"
  });
});

// Server start
const PORT = process.env.PORT || 5000;

async function ensureParentAccountSchema() {
  try {
    const sequelize = require("./config/db");
    const ddlPath = path.join(
      __dirname,
      "../backend/migrations/create-parent-accounts.sql",
    );
    if (fs.existsSync(ddlPath)) {
      const ddl = fs.readFileSync(ddlPath, "utf8");
      await sequelize.query(ddl);
      console.log("✅ Parent account schema ready");
    }
  } catch (error) {
    console.warn("⚠️ Parent account schema ensure skipped:", error.original?.message || error.message || error);
  }
}

ensureParentAccountSchema().finally(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
});
