const express = require("express");
const router = express.Router();
const fcmController = require("../controllers/fcmController");
const parentAuth = require("../middleware/parentAuth");

router.post("/register-token", parentAuth, fcmController.registerToken);

module.exports = router;
