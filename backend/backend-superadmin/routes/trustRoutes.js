const express = require('express');
const router = express.Router();
const { createTrust, getAllTrusts, updateTrust } = require('../controllers/trustController');
const { verifySuperAdmin } = require('../middleware/authMiddleware');

// Create Trust
router.post('/create', verifySuperAdmin, createTrust);

// Get All Trusts
router.get('/all', verifySuperAdmin, getAllTrusts);

// Update Trust
router.patch('/:id', verifySuperAdmin, updateTrust);

module.exports = router;
