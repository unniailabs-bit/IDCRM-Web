const express = require("express");
const { getStudentForms, updateFormStatus, requestCorrection, updateStudentForm } = require("../controllers/teacherStudentFormsController");
const teacherAuth = require("../middleware/authmiddleware");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// ========================
// MULTER CONFIGURATION FOR FILE UPLOADS
// ========================
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: fileFilter
});

// GET all student forms for teacher's class
router.get("/", teacherAuth, getStudentForms);

// PATCH form status (approve/reject)
router.patch("/:id", teacherAuth, updateFormStatus);

// PATCH direct update of student details (with photo uploads)
router.patch("/:id/update", teacherAuth, upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'father_photo', maxCount: 1 },
    { name: 'mother_photo', maxCount: 1 },
    { name: 'guardian_photo', maxCount: 1 }
]), updateStudentForm);

// PATCH request correction with field-level marking
router.patch("/:id/request-correction", teacherAuth, requestCorrection);

module.exports = router;
