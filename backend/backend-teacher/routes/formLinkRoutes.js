// // backend-school/routes/formLinkRoutes.js
// const express = require('express');
// const router = express.Router();
// const { createFormLink, getFormLinks } = require('../controllers/formLinkController');
// const { verifyTeacher } = require('../middleware/auth'); //

// //  Generate a new link
// router.post('/generate', verifyTeacher, createFormLink);

// // ✅ Get all links for a school
// router.get('/school/:school_id', verifyTeacher, getFormLinks);

// module.exports = router;
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    createFormLink,
    getFormLinks,
    getFormLinkInfo,
    submitFormViaLink,
    deactivateFormLink
} = require('../controllers/formLinkController');
const { verifyTeacher } = require('../middleware/auth');
const { publicApiLimiter } = require('../../middleware/rateLimiter');

// ========================
// MULTER CONFIGURATION FOR FILE UPLOADS
// ========================

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter to accept only images
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

// ========================
// TEACHER ROUTES (Protected)
// ========================

// Generate a new form link for a class/division
router.post('/generate', verifyTeacher, createFormLink);

// Get all form links for the logged-in teacher
router.get('/my-links', verifyTeacher, getFormLinks);

// Deactivate a form link
router.patch('/deactivate/:token', verifyTeacher, deactivateFormLink);

// ========================
// PUBLIC ROUTES (No Auth Required)
// ========================

// Get form link information (class, division, school)
router.get('/public/:token', publicApiLimiter, getFormLinkInfo);

// Submit form using public token (with multiple photo uploads)
router.post('/public/:token/submit', publicApiLimiter, upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'father_photo', maxCount: 1 },
    { name: 'mother_photo', maxCount: 1 },
    { name: 'guardian_photo', maxCount: 1 }
]), submitFormViaLink);

module.exports = router;
