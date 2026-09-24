const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const fs = require("fs");

const teacherAuth = require("../middleware/authmiddleware");
const { uploadStory, getTeacherStories, deleteStory } = require("../controllers/teacherStoryController");

// Ensure upload directory exists
const uploadDir = "uploads/stories/";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `story_${Date.now()}${ext}`);
    }
});
const upload = multer({ storage });

// POST upload story (text, image, video)
router.post("/story/upload", teacherAuth, upload.single("file"), (req, res, next) => {
    // Convert class_id and division_id to integer
    if (req.body.class_id) req.body.class_id = parseInt(req.body.class_id);
    if (req.body.division_id) req.body.division_id = parseInt(req.body.division_id);
    next();
}, uploadStory);

// GET all stories by teacher
router.get("/story/list", teacherAuth, getTeacherStories);

// DELETE story by id
router.delete("/story/delete/:id", teacherAuth, deleteStory);

module.exports = router;
