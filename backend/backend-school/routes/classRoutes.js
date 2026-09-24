
// const express = require('express');
// const router = express.Router();
// const { addClass, addDivision, getClasses, getDivisions } = require('../controllers/classController');
// const { verifySchoolAdmin } = require('../middleware/authMiddleware');

// // ---------------- Add Class ----------------
// router.post('/create', verifySchoolAdmin, addClass);
// // ---------------- Add Division ----------------
// router.post('/division', verifySchoolAdmin, addDivision);
// // ---------------- Get All Classes for a School ----------------
// router.get('/school/:school_id', verifySchoolAdmin, getClasses);

// // ---------------- Get Divisions of a Class ----------------
// router.get('/class/:class_name/divisions', verifySchoolAdmin, getDivisions);

// module.exports = router;


const express = require('express');
const router = express.Router();
const { 
  addClass, 
  addDivision, 
  getClasses, 
  getDivisions, 
  deleteClass, 
  updateClass, 
  updateDivision, 
  deleteDivision 
} = require('../controllers/classController');
const { verifySchoolAdmin } = require('../middleware/authMiddleware');

// ---------------- Add Class ----------------
router.post('/create', verifySchoolAdmin, addClass);

// ---------------- Add Division ----------------
router.post('/division', verifySchoolAdmin, addDivision);

router.get('/school/:school_id', verifySchoolAdmin, getClasses);

// ---------------- Get Divisions of a Class ----------------
router.get('/class/:class_name/divisions', verifySchoolAdmin, getDivisions);

router.delete('/delete/:class_id', verifySchoolAdmin, deleteClass);

router.patch('/update/:class_id', verifySchoolAdmin, updateClass);


router.patch('/division/update/:division_id', verifySchoolAdmin, updateDivision);

router.delete('/division/delete/:division_id', verifySchoolAdmin, deleteDivision);

module.exports = router;