const express = require("express");
const router = express.Router();
const teacherAuth = require("../middleware/authmiddleware");
const upload = require("../middleware/uploadCertificates"); // Multer for certificate upload

const {
  addCertificate,
  getCertificates,
  getCertificateById,
  deleteCertificate
} = require("../controllers/teacherCertificatesController");

// POST → Add certificate (single image)
router.post("/teacher-certificates", teacherAuth, upload.single("certificate_image"), addCertificate);

// GET → Get all certificates for teacher
router.get("/teacher-certificates", teacherAuth, getCertificates);

// GET → Get single certificate by ID
router.get("/teacher-certificates/:id", teacherAuth, getCertificateById);

// DELETE → Delete certificate by ID
router.delete("/teacher-certificates/:id", teacherAuth, deleteCertificate);

module.exports = router;
