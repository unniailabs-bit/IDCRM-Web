const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Folder
const uploadDir = path.join(__dirname, "../../uploads/principal_signs");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      "principal_sign_" + Date.now() + path.extname(file.originalname)
    );
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowed = /png|jpg|jpeg/;
  if (
    allowed.test(path.extname(file.originalname).toLowerCase()) &&
    allowed.test(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only PNG, JPG, JPEG allowed"));
  }
};

module.exports = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter,
});
