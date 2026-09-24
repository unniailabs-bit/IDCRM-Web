const express = require('express');
const router = express.Router();
const teacherAuth = require('../middleware/authmiddleware'); // your auth middleware
const multer = require('multer');
const path = require('path');
const {
  addAward,
  getAwards,
  getAwardById,
  deleteAward
} = require('../controllers/teacherAwardsController');

// ======= Multer Setup for Award Images =======
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/awards/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ===== Routes =====
router.post('/award', teacherAuth, upload.single('award_image'), addAward);
router.get('/award', teacherAuth, getAwards);
router.get('/award/:id', teacherAuth, getAwardById);
router.delete('/award/:id', teacherAuth, deleteAward);

module.exports = router;
