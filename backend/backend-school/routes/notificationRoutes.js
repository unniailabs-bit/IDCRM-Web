const express = require('express');
const router = express.Router();
const {
    createNotification,
    getNotifications,
    updateNotification,
    deleteNotification
} = require('../controllers/notificationController');
const { verifySchoolAdmin } = require('../middleware/authMiddleware');
const notificationMediaUpload = require('../middleware/notificationMediaUpload');

// Create Notification (with optional media upload)
router.post('/create', verifySchoolAdmin, notificationMediaUpload.single('media'), createNotification);

// Get All Notifications
router.get('/', verifySchoolAdmin, getNotifications);

// Update Notification (with optional media upload)
router.patch('/:id', verifySchoolAdmin, notificationMediaUpload.single('media'), updateNotification);

// Delete Notification
router.delete('/:id', verifySchoolAdmin, deleteNotification);
module.exports = router;

