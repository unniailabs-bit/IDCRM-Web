const express = require('express');
const router = express.Router();
const { 
  createSchoolByTrust, 
  getSchoolsByTrust, 
  getTeachersBySchool, 
  createTeacherForSchool,
  updateSchoolByTrust,
  deleteSchoolByTrust,
  getSchoolCredentials,
  resetSchoolPassword,
  sendSchoolCredentials,
  createClassForSchool,
  createDivisionForClass,
  getClassesForSchool,
  updateTeacherForSchool,
  deleteTeacherForSchool
} = require('../controllers/trustSchoolController');
const { verifyTrustAuth } = require('../middleware/trustAuthMiddleware');

// ---------------- Trust Creates a School ----------------
router.post('/create', verifyTrustAuth, createSchoolByTrust);

// ---------------- Trust Gets All Its Schools ----------------
router.get('/all', verifyTrustAuth, getSchoolsByTrust);

// ---------------- Credentials Management (MUST come before /:school_id routes) ----------------
router.get('/:school_id/credentials', verifyTrustAuth, getSchoolCredentials);
router.post('/:school_id/reset-password', verifyTrustAuth, resetSchoolPassword);
router.post('/:school_id/send-credentials', verifyTrustAuth, sendSchoolCredentials);

// ---------------- Classes and Divisions (MUST come before /:school_id routes) ----------------
router.get('/:school_id/classes', verifyTrustAuth, getClassesForSchool);
router.post('/:school_id/classes', verifyTrustAuth, createClassForSchool);
router.post('/:school_id/classes/:class_id/divisions', verifyTrustAuth, createDivisionForClass);

// ---------------- Get Teachers for a School (MUST come before /:school_id routes) ----------------
router.get('/:school_id/teachers', verifyTrustAuth, getTeachersBySchool);

// Create Teacher for a School
router.post('/:school_id/teachers', verifyTrustAuth, createTeacherForSchool);

// ---------------- Update/Delete Teacher (MUST come before /:school_id routes) ----------------
router.patch('/:school_id/teachers/:teacher_id', verifyTrustAuth, updateTeacherForSchool);
router.delete('/:school_id/teachers/:teacher_id', verifyTrustAuth, deleteTeacherForSchool);

// ---------------- Update School (PATCH) ----------------
router.patch('/:school_id', verifyTrustAuth, updateSchoolByTrust);

// ---------------- Delete School (DELETE) ----------------
router.delete('/:school_id', verifyTrustAuth, deleteSchoolByTrust);

module.exports = router;
