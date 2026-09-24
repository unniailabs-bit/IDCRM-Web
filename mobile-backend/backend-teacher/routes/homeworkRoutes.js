const express = require("express");
const router = express.Router();
const teacherAuth = require("../middleware/authmiddleware");
const multer = require("multer");
const path = require("path");
const { createHomework, getTeacherClasses } = require("../controllers/homeworkController");

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/homework"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// GET teacher's divisions
router.get("/classes", teacherAuth, getTeacherClasses);

// POST create homework
router.post("/homework", teacherAuth, upload.array("files", 5), createHomework);

module.exports = router;
