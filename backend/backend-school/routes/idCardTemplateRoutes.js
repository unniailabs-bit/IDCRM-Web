const express = require('express');
const router = express.Router();
const { listTemplates, saveTemplate, deleteTemplate } = require('../controllers/idCardTemplateController');
const { verifySchoolAdmin } = require('../middleware/authMiddleware');

// ---------------- ID Card Template Routes (per school) ----------------
router.get('/', verifySchoolAdmin, listTemplates);
router.put('/:id', verifySchoolAdmin, saveTemplate);
router.delete('/:id', verifySchoolAdmin, deleteTemplate);

module.exports = router;
