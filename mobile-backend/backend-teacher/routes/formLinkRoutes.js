const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import Controller
const formLinkController = require('../controllers/formLinkController');

// Import Middleware
const teacherAuth = require('../middleware/authmiddleware');

// ========================
// MULTER CONFIGURATION
// ========================
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const isMatch = allowedTypes.test(path.extname(file.originalname).toLowerCase()) && allowedTypes.test(file.mimetype);
        if (isMatch) return cb(null, true);
        cb(new Error('Only image files are allowed!'));
    }
});

// ========================
// ROUTES
// ========================

// Teacher Routes
router.post('/generate', teacherAuth, formLinkController.createFormLink);
router.get('/my-links', teacherAuth, formLinkController.getFormLinks);
router.patch('/deactivate/:token', teacherAuth, formLinkController.deactivateFormLink);

// Public Routes
router.get('/public/:token', formLinkController.getFormLinkInfo);
router.post('/public/:token/submit', upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'father_photo', maxCount: 1 },
    { name: 'mother_photo', maxCount: 1 },
    { name: 'guardian_photo', maxCount: 1 }
]), formLinkController.submitFormViaLink);

module.exports = router;