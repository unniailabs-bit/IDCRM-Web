const express = require("express");
const router = express.Router();
const teacherAuth = require("../middleware/authmiddleware");
const {
    getStudentsWithMessages,
    getChatHistory,
    replyToStudent,
    getSentMessages,
    toggleMessaging,
    getMessagingStatus
} = require("../controllers/teacherMessageController");

// Get messaging status
router.get("/messages/status", teacherAuth, getMessagingStatus);

// Toggle messaging (enable/disable)
router.post("/messages/toggle", teacherAuth, toggleMessaging);

// Get list of students who messaged the teacher
router.get("/messages/students", teacherAuth, getStudentsWithMessages);

// Get list of all sent messages by teacher
router.get("/messages/sent", teacherAuth, getSentMessages);

// Get chat history with a specific student
router.get("/messages/history/:student_id", teacherAuth, getChatHistory);

// Reply to a student message
router.post("/messages/reply", teacherAuth, replyToStudent);

module.exports = router;
