const express = require("express");
const { shareFormLink } = require("../controllers/studentFormShareController");
const { verifyTeacher } = require("../middleware/auth");

const router = express.Router();

// POST /api/teacher/share-form
router.post("/share-form", verifyTeacher, shareFormLink);

module.exports = router;
