const express = require('express');
const { submitStudentForm } = require('../controllers/studentFormsController.js');

const router = express.Router();

// ✅ Students can directly submit the form (no authentication required)
router.post('/submit', submitStudentForm);

module.exports = router;
