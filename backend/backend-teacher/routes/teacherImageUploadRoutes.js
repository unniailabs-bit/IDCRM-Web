const express = require("express");
const router = express.Router();
const {
  uploadStudentPhoto,
  submitForIDGeneration,
  upload,
} = require("../controllers/teacherImageUploadController");
const { verifyTeacher } = require("../middleware/auth");

// Upload student photo
router.post("/upload-student-photo", verifyTeacher, upload, uploadStudentPhoto);

// Submit students for ID card generation
router.post("/submit-for-id-generation", verifyTeacher, submitForIDGeneration);

module.exports = router;

