const express = require("express");
const router = express.Router();
const parentAuth = require("../middleware/parentAuth");
const {
  getNotifications,
  getSchoolNotifications,
  getClassroomNotifications,
  getTeacherNotifications,
  markAsRead,
  markAllAsRead
} = require("../controllers/studentNotificationController");

// GET all notifications (Aggregate) for the student/parent
router.get("/notifications", parentAuth, getNotifications);

// POST mark a notification as read
router.post("/mark-as-read", parentAuth, markAsRead);

// POST mark all as read
router.post("/mark-all-read", parentAuth, markAllAsRead);

module.exports = router;
