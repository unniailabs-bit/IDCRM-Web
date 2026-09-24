const express = require("express");
const router = express.Router();
const parentController = require("../controllers/parentController");
const parentAuth = require("../middleware/parentAuth");

// POST /api/parent/login
router.post("/login", parentController.parentLogin);

router.get("/linked-students", parentAuth, parentController.getLinkedStudents);
router.post("/switch-student", parentAuth, parentController.switchStudent);

router.get("/dashboard", parentAuth, parentController.getParentDashboard);

// Update parent profile
router.patch("/profile", parentAuth, parentController.updateParentProfile);

module.exports = router;
