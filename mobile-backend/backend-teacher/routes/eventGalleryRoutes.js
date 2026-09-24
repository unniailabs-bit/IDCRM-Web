const express = require("express");
const router = express.Router();

const {
  uploadEventGallery,
  getEventGallery,
  deleteEvent
} = require("../controllers/eventGalleryController");

const teacherAuth = require("../middleware/authmiddleware");
const upload = require("../middleware/uploadGallery"); // 👈 multer

// POST → Upload gallery (single / multiple photos)
router.post(
  "/gallery",
  teacherAuth,
  upload.array("photos", 10), // 👈 form-data key = photos
  uploadEventGallery
);

// GET → View gallery (class + division)
router.get("/gallery", teacherAuth, getEventGallery);

// DELETE → Delete event (and its photos)
router.delete("/gallery/:event_id", teacherAuth, deleteEvent);

module.exports = router;
