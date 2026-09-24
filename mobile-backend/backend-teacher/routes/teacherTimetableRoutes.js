const express = require("express");
const router = express.Router();
const teacherAuth = require("../middleware/authmiddleware");
const timetableController = require("../controllers/timetableController");
const upload = require("../middleware/uploadTimetables");

// CREATE timetable
router.post(
    "/timetable",
    teacherAuth,
    upload.single("timetable_file"), // 👈 Form-data key = timetable_file
    timetableController.createTimetable
);

// GET all timetables for teacher's class
router.get("/timetable", teacherAuth, timetableController.getTimetables);

// GET single timetable by id
router.get("/timetable/:id", teacherAuth, timetableController.getTimetableById);

// UPDATE timetable
router.patch(
    "/timetable/:id",
    teacherAuth,
    upload.single("timetable_file"),
    timetableController.updateTimetable
);

// DELETE timetable
router.delete("/timetable/:id", teacherAuth, timetableController.deleteTimetable);

module.exports = router;
