const express = require('express');
const router = express.Router();
const { verifySchoolAdmin } = require('../middleware/authMiddleware');
const {
    createFeePlan,
    getFeePlan,
    updateFeePlan,
    deleteFeePlan,
    getAllFeePlans
} = require('../controllers/schoolFeesController');

// Create a new fee plan for a class
router.post('/create', verifySchoolAdmin, createFeePlan);

// Get all fee plans for the school
router.get('/all', verifySchoolAdmin, getAllFeePlans);

// Get fee plan by class_id
router.get('/:class_id', verifySchoolAdmin, getFeePlan);

// Update fee plan by class_id
router.patch('/update/:class_id', verifySchoolAdmin, updateFeePlan);

// Delete fee plan by class_id
router.delete('/delete/:class_id', verifySchoolAdmin, deleteFeePlan);

module.exports = router;
