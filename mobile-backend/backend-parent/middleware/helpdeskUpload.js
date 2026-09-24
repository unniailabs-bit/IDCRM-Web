const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: "uploads/helpdesk",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

module.exports = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
