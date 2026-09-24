const express = require("express");
const router = express.Router();
const teacherAuth = require("../middleware/authmiddleware");
const { addSubject, getSubjects, updateSubject, deleteSubject } = require("../controllers/subjectController");

router.post("/subjects/add", teacherAuth, addSubject);
router.get("/subjects", teacherAuth, getSubjects);
router.patch("/subjects/update", teacherAuth, updateSubject);
router.delete("/subjects/delete/:id", teacherAuth, deleteSubject);

module.exports = router;
