const express = require("express");
const router = express.Router();

const { generateStudentId, getStudentIDStatusList } = require("../controllers/schoolGenerateIdController");
const { verifySchoolAdmin } = require("../middleware/authMiddleware");

// =======================
// GENERATE STUDENT ID
// =======================
router.post(
  "/generate-id",
  verifySchoolAdmin,
  generateStudentId
);

router.get(
  "/status-list",
  verifySchoolAdmin,
  getStudentIDStatusList
);

module.exports = router;
