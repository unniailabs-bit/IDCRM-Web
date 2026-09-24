const express = require('express');
const router = express.Router();
const { updateTrustStatus } = require('../controllers/RegistrationstatusController');
const { verifySuperAdmin } = require('../middleware/authMiddleware');

// Update registration status (approve/reject)
router.put('/trusts/:trustId/status', verifySuperAdmin, updateTrustStatus);

module.exports = router;
