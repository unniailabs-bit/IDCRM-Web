const express = require("express");
const router = express.Router();
const { getStudentByQr, getMyDigitalId } = require("../controllers/QrcodeController");
const parentAuth = require("../middleware/parentAuth");// login middleware

// 🔹 Student dashboard route
// Logged-in student sees own digital ID data + QR token
router.get("/me", parentAuth, getMyDigitalId);

// 🔹 Public QR code route
// Anyone can scan and view approved student details
router.get("/:form_token", getStudentByQr);

module.exports = router;
