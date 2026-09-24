const express = require("express");

const {
  getSchoolFormsSummary,
  getClassStudentForms
} = require("../controllers/DigitalFormsController");
const { verifySchoolAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// GET school-level summary (JSON by default, detailed CSV if ?export=csv)
router.get("/school-summary", (req, res, next) => {
  console.log('🔍 /school-summary endpoint hit');
  console.log('User:', req.user);
  next();
}, verifySchoolAdmin, getSchoolFormsSummary);

// GET student forms for a specific class/division
router.get("/class-students", verifySchoolAdmin, getClassStudentForms);


module.exports = router;