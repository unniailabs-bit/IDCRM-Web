const express = require("express");
const router = express.Router();
const teacherAuth = require("../middleware/authmiddleware");
const upload = require("../middleware/uploadNotification");
const {
    getNotifications,
    sendNotification,
    updateNotification,
    deleteNotification
} = require("../controllers/notificationController");

// Get all notifications sent by teacher
router.get("/notifications", teacherAuth, getNotifications);

// Send new notification (with optional image)
router.post("/notifications", teacherAuth, upload.single("image"), sendNotification);

// Update a notification
router.patch("/notifications/:id", teacherAuth, upload.single("image"), updateNotification);

// Delete a notification
router.delete("/notifications/:id", teacherAuth, deleteNotification);

module.exports = router;
