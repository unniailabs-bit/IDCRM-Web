const express = require('express');
const router = express.Router();
const studentCertificateController = require('../controllers/studentCertificateController');
const studentAuth = require('../middleware/studentAuth'); // your auth middleware

// ✅ Correct route
router.get('/certificates', studentAuth, studentCertificateController.getStudentCertificates);

module.exports = router;
