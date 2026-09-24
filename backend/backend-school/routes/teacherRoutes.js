const express = require('express');
const router = express.Router();
const { addTeacher, getTeachers, updateTeacher, deleteTeacher, importTeachersFromExcel, getTeacherClasses } = require('../controllers/teacherController');
const { verifySchoolAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for Excel Upload
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'teacher-import-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Allow standard excel types, csv, and check extension case-insensitively
    if (
        file.mimetype.includes('excel') || 
        file.mimetype.includes('spreadsheet') || 
        file.mimetype.includes('csv') ||
        file.originalname.match(/\.(xlsx|xls|csv)$/i)
    ) {
        cb(null, true);
    } else {
        cb(new Error('Only Excel/CSV files are allowed!'), false);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Add Teacher
router.post('/create', verifySchoolAdmin, addTeacher);

// Import Teachers via Excel
router.post('/import-excel', verifySchoolAdmin, upload.single('file'), importTeachersFromExcel);

// Get Teachers by School
router.get('/school/:school_id', verifySchoolAdmin, getTeachers);

// Update Teacher
router.patch('/:teacher_id', verifySchoolAdmin, updateTeacher);

// Delete Teacher
router.delete('/:teacher_id', verifySchoolAdmin, deleteTeacher);

// Get specific Teacher Classes
// router.get('/:teacher_id/classes', verifySchoolAdmin, getTeacherClasses);

module.exports = router;
