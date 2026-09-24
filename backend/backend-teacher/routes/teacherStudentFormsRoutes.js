const express = require("express");
const { getStudentForms, updateFormStatus, requestCorrection, updateStudentForm, bulkUpdateFormStatus, deleteStudentForms } = require("../controllers/teacherStudentFormsController");
const { verifyTeacher } = require("../middleware/auth");
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
    if (file.fieldname === 'zipFile') {
        const allowedZipTypes = /zip|x-zip-compressed|octet-stream/;
        const isZipExt = path.extname(file.originalname).toLowerCase() === '.zip';
        const isZipMime = allowedZipTypes.test(file.mimetype);

        if (isZipExt) { // Trust extension primarily for zips as mimetype can vary
            return cb(null, true);
        } else {
            return cb(new Error('Only .zip files are allowed for bulk upload!'));
        }
    }

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
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for zips
    fileFilter: fileFilter
});

// GET all student forms for teacher's class
router.get("/", verifyTeacher, getStudentForms);

// PATCH form status (approve/reject)
router.patch("/bulk-status", verifyTeacher, bulkUpdateFormStatus);
router.patch("/:id", verifyTeacher, updateFormStatus);
// PATCH direct update of student details (with photo uploads)
router.patch("/:id/update", verifyTeacher, upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'father_photo', maxCount: 1 },
    { name: 'mother_photo', maxCount: 1 },
    { name: 'guardian_photo', maxCount: 1 },
    { name: 'student_signature', maxCount: 1 }
]), updateStudentForm);

// PATCH request correction with field-level marking
router.patch("/:id/request-correction", verifyTeacher, requestCorrection);

// DELETE student forms (Bulk)
router.post("/delete-bulk", verifyTeacher, deleteStudentForms);

const { bulkUploadPhotos, bulkUploadSignatures } = require("../controllers/bulkUploadController");

// POST bulk upload student photos via ZIP file
router.post("/bulk-photo-upload", verifyTeacher, (req, res, next) => {
    upload.single("zipFile")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({
                    success: false,
                    message: "Unexpected field name. Please use key 'zipFile' for the ZIP file."
                });
            }
            return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
}, bulkUploadPhotos);

// POST bulk upload student signatures via ZIP file
router.post("/bulk-signature-upload", verifyTeacher, (req, res, next) => {
    upload.single("zipFile")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({
                    success: false,
                    message: "Unexpected field name. Please use key 'zipFile' for the ZIP file."
                });
            }
            return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
}, bulkUploadSignatures);

module.exports = router;
