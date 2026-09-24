// ------------------- Imports -------------------
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const sequelize = require('./config/db');

// ------------------- Swagger Setup -------------------
const { swaggerUi, swaggerSpec } = require('./config/swagger');

// ------------------- Import Routes -------------------
const superAdminRoutes = require('./backend-superadmin/routes/superAdminRoutes');
const creditsummarytrustsRoutes = require('./backend-superadmin/routes/creditsummarytrustsRoutes');
const trustCreditRoutes = require("./backend-superadmin/routes/trustCreditRoutes");
const trustCreditSummaryRoutes = require('./backend-trust/routes/trustCreditSummaryRoutes');
const RegistrationstatusRoutes = require('./backend-superadmin/routes/RegistrationstatusRoutes');
const trustRoutes = require('./backend-superadmin/routes/trustRoutes');
const schoolRoutes = require('./backend-superadmin/routes/schoolRoutes');
const schoolLogoRoutes = require('./backend-school/routes/schoolLogoRoutes');
const Schooleditstudentform = require('./backend-school/routes/Schooleditstudentform');
const principalSignRoutes = require('./backend-school/routes/principalSignRoutes');
const digitalFormsRoutes = require("./backend-school/routes/digitalFormsRoutes");
const schoolAuthRoutes = require('./backend-school/routes/schoolAuthRoutes');
const trustSchoolRoutes = require('./backend-trust/routes/trustSchoolRoutes');
const trustMessageRoutes = require("./backend-trust/routes/trustMessageRoutes");
const trustGeneratedIdsRoutes = require("./backend-trust/routes/trustGeneratedIdsRoutes");
const trustAuthRoutes = require('./backend-trust/routes/authRoutes');
const subjectRoutes = require('./backend-trust/routes/subjectRoutes');
const analyticsRoutes = require('./backend-trust/routes/analyticsRoutes');
const studentRoutes = require('./backend-school/routes/studentRoutes');
const schoolClassRoutes = require('./backend-school/routes/classRoutes');
const schoolGenerateIdRoutes = require('./backend-school/routes/schoolGenerateIdRoutes');
const studentIDRoutes = require("./backend-school/routes/studentIDRoutes");
const teacherRoutes = require('./backend-school/routes/teacherRoutes');
const schoolDashboardRoutes = require('./backend-school/routes/schoolDashboardRoutes');
const schoolSettingsRoutes = require('./backend-school/routes/schoolSettingsRoutes');
const schoolReportsRoutes = require('./backend-school/routes/schoolReportsRoutes');
const teacherAuthRoutes = require('./backend-teacher/routes/authRoutes');
const ImportstudentRoute = require('./backend-teacher/routes/ImportstudentRoute');
const teacherMyclassesRoutes = require('./backend-teacher/routes/teacherMyclassesRoutes');
const teacherStudentFormsRoutes = require('./backend-teacher/routes/teacherStudentFormsRoutes');
const teacherPendingApprovalRoutes = require("./backend-teacher/routes/teacherPendingApprovalRoutes");
const teacherImageUploadRoutes = require('./backend-teacher/routes/teacherImageUploadRoutes');
const studentsDetailsRoutes = require('./backend-teacher/routes/studentsDetailsRoutes');
const studentFormsRoutes = require('./backend-teacher/routes/studentFormsRoutes');
const studentFormShareRoutes = require('./backend-teacher/routes/studentFormShareRoutes');
const formLinkRoutes = require('./backend-teacher/routes/formLinkRoutes');
const trustRegistrationRoutes = require('./backend-trust/routes/trustRegistrationRoutes');
const studentFormRoutes = require('./backend-school/routes/studentFormRoutes');
// ------------------- App Setup -------------------
const app = express();
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// ------------------- Global Rate Limiter -------------------
const { generalApiLimiter } = require('./middleware/rateLimiter');
app.use(generalApiLimiter); // Apply to all routes for baseline protection

// ------------------- CORS Setup -------------------
const allowedOrigins = [
  "http://localhost:3000",
  "https://crm.mydigiinfocard.com",
  "https://uat.mydigiinfocard.com",
  process.env.FRONTEND_URL,
].filter(Boolean); // Remove undefined values

// Add Cloud Run pattern matching
const isCloudRunOrigin = (origin) => {
  if (!origin) return false;
  return origin.includes('.run.app') || origin.includes('cloudfunctions.net');
};

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Check if it's a Cloud Run domain
      if (isCloudRunOrigin(origin)) {
        return callback(null, true);
      }

      // Check against allowed origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // In development, allow all
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// ------------------- Serve Static Files (Uploads) -------------------
// Place AFTER CORS so uploaded images also get CORS headers
const path = require('path');
const fs = require('fs');
app.use('/uploads', (req, res, next) => {
  let filePath = req.path.startsWith('/') ? req.path.substring(1) : req.path;
  
  // Try main uploads folder
  const mainPath = path.join(__dirname, 'uploads', filePath);
  if (fs.existsSync(mainPath) && fs.statSync(mainPath).isFile()) {
    return res.sendFile(mainPath);
  }
  
  // Fallback to mobile-backend uploads folder
  const mobilePath = path.join(__dirname, '..', 'mobile-backend', 'uploads', filePath);
  if (fs.existsSync(mobilePath) && fs.statSync(mobilePath).isFile()) {
    return res.sendFile(mobilePath);
  }
  
  res.status(404).json({ success: false, message: 'File not found' });
});

// ------------------- Swagger Documentation -------------------
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'ID CRM API Documentation',
}));

// ------------------- Root Route -------------------
app.get('/', (req, res) => {
  res.json({
    message: '✅ IDCRM API is running',
    documentation: '/api-docs',
    version: '1.0.0'
  });
});

// ------------------- API Routes -------------------

// Super Admin
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/superadmin', creditsummarytrustsRoutes);
app.use('/api/superadmin', RegistrationstatusRoutes);
app.use('/api/trust', trustCreditSummaryRoutes);
app.use("/api/superadmin", trustCreditRoutes);
const superAdminSubjectRoutes = require('./backend-superadmin/routes/subjectRoutes');
app.use('/api/superadmin/subjects', superAdminSubjectRoutes);
app.use('/api/superadmin/book-demos', require('./backend-superadmin/routes/bookDemoRoutes'));
// Trust
app.use('/api/trust', trustRoutes);
app.use('/api/trust/auth', trustAuthRoutes);
app.use('/api/trust/schools', trustSchoolRoutes);
app.use("/api/trust", trustMessageRoutes);
app.use('/api/trust/subjects', subjectRoutes);
app.use('/api/trust/analytics', analyticsRoutes);
app.use('/api/trust', trustRegistrationRoutes);
app.use('/api/trust', trustGeneratedIdsRoutes);
// School
// #region agent log
fetch('http://127.0.0.1:7242/ingest/44e11d4c-cdfa-490a-8592-2061398e4056', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'server.js:117', message: 'registering school auth routes', data: { route: '/api/school/auth', hasRoutes: !!schoolAuthRoutes }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' }) }).catch(() => { });
// #endregion
app.use('/api/school/auth', schoolAuthRoutes);
app.use('/api/school/notifications', require('./backend-school/routes/notificationRoutes')); // [NEW] Notification Routes (Moved up)
app.use('/api/school/calendar', require('./backend-school/routes/schoolCalendarRoutes')); // [NEW] School Calendar Routes
app.use("/api/school", digitalFormsRoutes);
app.use('/api/school/class', schoolClassRoutes);
app.use('/api/school/fees', require('./backend-school/routes/schoolFeesRoutes')); // [NEW] School Fees Routes
app.use('/api/school/teacher', teacherRoutes);
app.use('/api/school/student', studentRoutes);
app.use('/api/school/appointments', require('./backend-school/routes/appointmentRoutes'));
app.use('/api/school', schoolRoutes);
app.use('/api/school', schoolLogoRoutes);
app.use('/api/school', principalSignRoutes);
app.use("/api/school", studentIDRoutes);
app.use("/api/school", schoolGenerateIdRoutes);
app.use("/api/school/student-forms", studentFormRoutes);
app.use('/api/school/dashboard', schoolDashboardRoutes);
app.use('/api/school/settings', schoolSettingsRoutes);
app.use('/api/school/reports', schoolReportsRoutes);
app.use('/api/school/info', require('./backend-school/routes/schoolInfoRoutes')); // [NEW] Public School Info Routes
app.use("/api/school", Schooleditstudentform);

// Teacher
app.use('/api/teacher/auth', teacherAuthRoutes);
app.use('/api/teacher/myclass', teacherMyclassesRoutes);
app.use("/api/teacher", teacherPendingApprovalRoutes);
app.use('/api/teacher/student-forms', teacherStudentFormsRoutes);
app.use('/api/form-links', formLinkRoutes);
app.use("/api/teacher", ImportstudentRoute);
app.use("/api/teacher", studentsDetailsRoutes);
app.use("/api/teacher", teacherImageUploadRoutes);
// Student Form and Sharing
app.use('/api/student-forms', studentFormsRoutes);
app.use('/api/student', require('./backend-school/routes/publicVerifyStudentRoutes'));
app.use('/api/student/public', require('./backend-school/routes/publicStudentRoutes')); // [NEW] Public Student Search
app.use('/api/public/book-demo', require('./backend-superadmin/routes/bookDemoRoutes'));
app.use('/api/teacher', studentFormShareRoutes);

// ------------------- Database Sync -------------------
sequelize
  .sync({ alter: true })
  .then(() => console.log('✅ Database synchronized'))
  .catch(err => console.error('❌ Sync failed:', err));

// ------------------- Server Start -------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () =>
  console.log(`🚀 Server running on port ${PORT}`)
);