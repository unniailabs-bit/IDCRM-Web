const express = require("express");
const router = express.Router();
const teacherAuth = require("../middleware/authmiddleware");
const schoolTimetableController = require("../controllers/schoolTimetableController");
const upload = require("../middleware/uploadSchoolTimetables");

// CREATE school timetable
router.post(
    "/school-timetable",
    teacherAuth,
    upload.single("media_file"), // Form-data key = media_file
    schoolTimetableController.createSchoolTimetable
);

// GET all school timetables for teacher's school
router.get("/school-timetable", teacherAuth, schoolTimetableController.getSchoolTimetables);

// UPDATE school timetable
router.patch(
    "/school-timetable/:id",
    teacherAuth,
    upload.single("media_file"),
    schoolTimetableController.updateSchoolTimetable
);

// DELETE school timetable
router.delete("/school-timetable/:id", teacherAuth, schoolTimetableController.deleteSchoolTimetable);

module.exports = router;
