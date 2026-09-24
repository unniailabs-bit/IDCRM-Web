const express = require("express");
const router = express.Router();
const studentAuth = require("../middleware/studentAuth");
const {
  getTeachersForStudent,
  sendMessageToTeacher,
  getChatHistory,
  getReceivedMessages
} = require("../controllers/studentMessageController");

// Get teachers for student
router.get("/messages/teachers", studentAuth, getTeachersForStudent);

// Get messages received from teachers
router.get("/messages/received", studentAuth, getReceivedMessages);

// Send message to teacher
router.post("/messages/send", studentAuth, sendMessageToTeacher);

// Get chat history with a teacher
router.get("/messages/history", studentAuth, getChatHistory);

module.exports = router;
