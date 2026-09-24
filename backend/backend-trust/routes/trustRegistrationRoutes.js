const express = require('express');
const { registerTrust } = require('../controllers/trustRegistrationController.js');
const { verifyTrustAuth } = require('../middleware/trustAuthMiddleware.js');

const router = express.Router();

// 1️⃣ New Registration → NO JWT Required
router.post('/register', registerTrust);

// 2️⃣ Update Existing Trust → JWT Required
router.put('/register', verifyTrustAuth, registerTrust);

module.exports = router;
