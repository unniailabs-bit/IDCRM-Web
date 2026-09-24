const express = require("express");
const router = express.Router();
const fcmController = require("../controllers/fcmController");
const teacherAuth = require("../middleware/authmiddleware"); // Corrected middleware name

router.post("/register-token", teacherAuth, fcmController.registerToken);

module.exports = router;
