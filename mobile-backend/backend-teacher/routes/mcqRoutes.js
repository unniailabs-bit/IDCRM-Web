const express = require("express");
const router = express.Router();
const teacherAuth = require("../middleware/authmiddleware");
const mcqController = require("../controllers/mcqController");

// -----------------------------
// Add MCQs (Excel upload)
// -----------------------------
router.post("/mcq", teacherAuth, mcqController.uploadExcel, mcqController.addMcqQuestions);

// -----------------------------
// Get all MCQs for logged-in teacher
// -----------------------------
router.get("/mcq/teacher", teacherAuth, mcqController.getTeacherMcqs);

// -----------------------------
// Get materials list for MCQ mapping
// (material_id, material_title, material_type)
// -----------------------------
router.get(
  "/mcq/materials",
  teacherAuth,
  mcqController.getTeacherMaterialsForMcq
);

// -----------------------------
// Update single MCQ
// -----------------------------
router.patch("/mcq/update", teacherAuth, mcqController.updateMcq);

// -----------------------------
// Delete single MCQ
// -----------------------------
router.delete("/mcq/delete/:id", teacherAuth, mcqController.deleteMcq);

// -----------------------------
// Delete selected MCQs for logged-in teacher (Batch delete)
// -----------------------------
router.delete("/mcq", teacherAuth, mcqController.deleteTeacherMcqs);
router.delete("/mcq/group", teacherAuth, mcqController.deleteMcqGroupByTitle);

module.exports = router;
