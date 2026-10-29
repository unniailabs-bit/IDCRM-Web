const express = require("express");
const router = express.Router();
const parentController = require("../controllers/parentController");
const parentAuth = require("../middleware/parentAuth");
const adminAuth = require("../middleware/adminAuth");

// POST /api/parent/login
router.post("/login", parentController.parentLogin);

// POST /api/parent/refresh-token  (accepts expired tokens, re-issues fresh JWT)
router.post("/refresh-token", parentController.refreshToken);

router.get("/linked-students", parentAuth, parentController.getLinkedStudents);
router.post("/switch-student", parentAuth, parentController.switchStudent);

router.get("/dashboard", parentAuth, parentController.getParentDashboard);

// Update parent profile
router.patch("/profile", parentAuth, parentController.updateParentProfile);

// Diagnostic: check login state for a phone number (requires ADMIN_SECRET)
router.get("/debug-login", adminAuth, parentController.debugLogin);

// Admin: force-reset password for a phone number (requires ADMIN_SECRET)
router.post("/admin-reset-password", adminAuth, parentController.adminResetPassword);

module.exports = router;
