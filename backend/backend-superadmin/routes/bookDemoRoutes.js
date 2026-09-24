const express = require('express');
const router = express.Router();
const { submitBookDemo, getBookDemos } = require('../controllers/bookDemoController');
const { verifySuperAdmin } = require('../middleware/authMiddleware');

// Public route to submit demo request
router.post('/submit', submitBookDemo);

// Protected route to get demo requests (Super Admin only)
router.get('/', verifySuperAdmin, getBookDemos);

module.exports = router;
