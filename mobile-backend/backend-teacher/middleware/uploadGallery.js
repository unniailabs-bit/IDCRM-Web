const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ✅ Upload folder
const UPLOAD_FOLDER = "uploads/event-gallery";

// Create folder if not exists
if (!fs.existsSync(UPLOAD_FOLDER)) {
  fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
}

// ✅ Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_FOLDER);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// ✅ File filter (images and videos)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|mkv|webm|3gp|flv|m4v/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype =
    allowedTypes.test(file.mimetype) ||
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/");

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only images and videos are allowed"));
  }
};

// ✅ Multer upload (no file size limit)
const upload = multer({
  storage,
  fileFilter
});

module.exports = upload;
