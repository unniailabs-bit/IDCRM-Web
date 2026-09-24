// backend-superadmin/routes/schoolRoutes.js
const express = require('express');
const router = express.Router();
const {
  createSchool,
  updateSchool,
  getAllSchools,
  getSchoolById,
  getSchoolCredentials,
  resetSchoolPassword,
  sendSchoolCredentials,
  createClassForSchool,
  createDivisionForClass,
  getClassesForSchool,
  getTeachersForSchool,
  createTeacherForSchool,
  updateTeacherForSchool,
  deleteTeacherForSchool,
  deleteSchool,
  updateClassForSchool,
  deleteClassForSchool,
  updateDivisionForClass,
  deleteDivisionForClass
} = require('../controllers/schoolController');
const { verifySuperAdmin } = require('../middleware/authMiddleware');

// ---------------- Create a new School ----------------
router.post('/create', verifySuperAdmin, createSchool);

// ---------------- Get All Schools ----------------
router.get('/all', verifySuperAdmin, getAllSchools);

// ---------------- Credentials Management (MUST come before /:id routes) ----------------
router.get('/:id/credentials', verifySuperAdmin, getSchoolCredentials);
router.post('/:id/reset-password', verifySuperAdmin, resetSchoolPassword);
router.post('/:id/send-credentials', verifySuperAdmin, sendSchoolCredentials);

// ---------------- Classes and Divisions (MUST come before /:id routes) ----------------
router.get('/:id/classes', verifySuperAdmin, getClassesForSchool);
router.post('/:id/classes', verifySuperAdmin, createClassForSchool);
router.patch('/:id/classes/:class_id', verifySuperAdmin, updateClassForSchool);
router.delete('/:id/classes/:class_id', verifySuperAdmin, deleteClassForSchool);

router.post('/:id/classes/:class_id/divisions', verifySuperAdmin, createDivisionForClass);
router.patch('/:id/classes/:class_id/divisions/:division_id', verifySuperAdmin, updateDivisionForClass);
router.delete('/:id/classes/:class_id/divisions/:division_id', verifySuperAdmin, deleteDivisionForClass);

// ---------------- Teachers Management (MUST come before /:id routes) ----------------
router.get('/:id/teachers', verifySuperAdmin, getTeachersForSchool);
router.post('/:id/teachers', verifySuperAdmin, createTeacherForSchool);
router.patch('/:id/teachers/:teacher_id', verifySuperAdmin, updateTeacherForSchool);
router.delete('/:id/teachers/:teacher_id', verifySuperAdmin, deleteTeacherForSchool);

// ---------------- Get School By ID (must be before /:id routes) ----------------
router.get('/:id', verifySuperAdmin, getSchoolById);

// ---------------- Update a School ----------------
router.patch('/:id', verifySuperAdmin, updateSchool);

// ---------------- Delete a School ----------------
router.delete('/:id', verifySuperAdmin, deleteSchool);

module.exports = router;
