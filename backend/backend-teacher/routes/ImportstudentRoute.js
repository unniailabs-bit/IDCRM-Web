const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { importStudentsExcel } = require("../controllers/ImportstudentController");
const { verifyTeacher } = require("../middleware/auth"); // JWT middleware

// Configure multer storage for Excel/CSV files in memory
const storage = multer.memoryStorage();

// File filter to accept Excel and CSV files
const fileFilter = (req, file, cb) => {
  const allowedTypes = /xlsx|xls|csv/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype =
    file.mimetype ===
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.mimetype === "application/vnd.ms-excel" ||
    file.mimetype === "text/csv" ||
    file.mimetype ===
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  if (mimetype || extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only Excel (.xlsx, .xls) and CSV files are allowed!"));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter,
});

router.post(
  "/import-excels",
  verifyTeacher, // verify JWT and attach req.user
  upload.single("file"),
  importStudentsExcel
);

module.exports = router;
