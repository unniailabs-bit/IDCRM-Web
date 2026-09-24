const express = require('express');
const router = express.Router();
const {
  markFieldsForCorrection,
  sendIndividualCorrectionLink,
  getFormWithCorrections,
  updateStudentForm,
  toggleFormActive,
  deleteStudentForms
} = require('../controllers/studentFormController');
const { verifySchoolAdmin } = require('../middleware/authMiddleware');

// Get form with corrections
router.get('/:formId', verifySchoolAdmin, getFormWithCorrections);

// Mark fields for correction
router.post('/:formId/mark-fields-correction', verifySchoolAdmin, markFieldsForCorrection);

// Send correction link
router.post('/:formId/send-correction-link', verifySchoolAdmin, sendIndividualCorrectionLink);

// Update student form
router.patch('/:formId', verifySchoolAdmin, updateStudentForm);

// Toggle form active/inactive
router.patch('/:formId/toggle-active', verifySchoolAdmin, toggleFormActive);

// DELETE student forms (Bulk)
router.post('/delete-bulk', verifySchoolAdmin, deleteStudentForms);

module.exports = router;

