const express = require("express");
const router = express.Router();

const parentAuth = require("../middleware/parentAuth"); 
// or parentAuth if parent login hai

const {
  getStudentMaterials,
  getStudentSubjects,
  getStudentChapters
} = require("../controllers/studentMaterialController");


router.get("/materials", parentAuth, getStudentMaterials);

router.get("/materials/subjects", parentAuth, getStudentSubjects);

module.exports = router;
