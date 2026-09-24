const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../../uploads/notifications");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, "notification-" + uniqueSuffix + path.extname(file.originalname));
    },
});

// File filter - accept images, PDFs, and common document types
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) ||
        file.mimetype.includes('image') ||
        file.mimetype.includes('pdf') ||
        file.mimetype.includes('document') ||
        file.mimetype.includes('spreadsheet');

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error("Only images, PDFs, and document files are allowed!"), false);
    }
};

// Create multer upload instance
const notificationMediaUpload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});

module.exports = notificationMediaUpload;
