const express = require("express");
const router = express.Router();
const {
  teacherLogin,
  unifiedLogin,
  selectProfile,
  requestPasswordReset,
  verifyOtpAndResetPassword,
  updateProfile,
} = require("../controllers/authcontroller");
const teacherAuth = require("../middleware/authmiddleware");
const upload = require("../middleware/uploadProfilePic");

router.post("/login", teacherLogin);
router.post("/unified-login", unifiedLogin);
router.post("/select-profile", selectProfile);

// Update Profile
router.patch("/update-profile", teacherAuth, upload.single("profile_pic"), updateProfile);

// Password Reset
router.post("/request-reset", requestPasswordReset);
router.post("/verify-otp", verifyOtpAndResetPassword);

module.exports = router;
