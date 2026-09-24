const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  getStudentFormsSchool,
  updateFormStatusSchool,
  requestCorrectionSchool,
  updateStudentFormSchool
} = require("../controllers/Schooleditstudentform");

const { verifySchoolAdmin } = require("../middleware/authMiddleware");

// =======================
// MULTER CONFIGURATION
// =======================
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) return cb(null, true);
    cb(new Error("Only images (jpeg, jpg, png) are allowed"));
  }
});

// =======================
// ROUTES
// =======================

// 1. GET ALL FORMS (This should be called as /api/school/student-forms)
router.get("/", verifySchoolAdmin, getStudentFormsSchool);

// 2. UPDATE STATUS
router.patch("/status/:id", verifySchoolAdmin, updateFormStatusSchool);

// 3. REQUEST CORRECTION
router.patch("/request-correction/:id", verifySchoolAdmin, requestCorrectionSchool);

// 4. UPDATE FORM DETAILS
router.patch("/update/:id",
  verifySchoolAdmin,
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'father_photo', maxCount: 1 },
    { name: 'mother_photo', maxCount: 1 },
    { name: 'guardian_photo', maxCount: 1 },
    { name: 'student_signature', maxCount: 1 }
  ]),
  updateStudentFormSchool
);

module.exports = router;