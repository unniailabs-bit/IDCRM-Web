const multer = require("multer");
const path = require("path");
const fs = require("fs");

// =======================
// Create folder if not exists
// =======================
const uploadDir = path.join(__dirname, "../../uploads/school_logos");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// =======================
// Multer Storage
// =======================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      "school_logo_" +
      Date.now() +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

// =======================
// File Filter
// =======================
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extName = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimeType = allowedTypes.test(file.mimetype);

  if (extName && mimeType) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG images allowed"));
  }
};

// =======================
// Multer Upload
// =======================
const schoolLogoUpload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter,
});

module.exports = schoolLogoUpload;
