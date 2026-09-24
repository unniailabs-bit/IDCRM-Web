const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { QueryTypes } = require("sequelize");
const sequelize = require("../../config/db");

// 1. Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 2. Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "student-photo-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// 3. File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter,
});

// Export multer upload middleware for the route
exports.upload = upload.single("photo");

// --- Controller Functions ---

// ✅ Upload single student photo
exports.uploadStudentPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Photo file is required",
      });
    }

    const { student_form_id } = req.body;
    const { school_id } = req.user;

    if (!student_form_id) {
      return res.status(400).json({
        success: false,
        message: "Student form ID is required",
      });
    }

    // Check student form exists (NO class/division check as per your requirement)
    const form = await sequelize.query(
      `SELECT id FROM student_forms
       WHERE id = :id AND school_id = :school_id`,
      {
        replacements: { id: student_form_id, school_id },
        type: QueryTypes.SELECT,
      }
    );

    if (form.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student form not found",
      });
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    const fullPhotoUrl =
      `${process.env.BACKEND_URL || "http://localhost:5000"}${photoUrl}`;

    // Update the photo in student_forms
    await sequelize.query(
      `UPDATE student_forms
       SET photo = :photo, updated_at = NOW()
       WHERE id = :id`,
      {
        replacements: {
          photo: fullPhotoUrl,
          id: student_form_id,
        },
        type: QueryTypes.UPDATE,
      }
    );

    res.status(200).json({
      success: true,
      message: "Photo uploaded successfully",
      photo: fullPhotoUrl,
      student_form_id,
    });
  } catch (error) {
    console.error("Error uploading student photo:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while uploading photo",
    });
  }
};

// ✅ Submit students for ID card generation
exports.submitForIDGeneration = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { student_form_ids, template_id } = req.body;
    const { school_id, id: teacher_id } = req.user;

    if (!Array.isArray(student_form_ids) || student_form_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "student_form_ids array is required",
      });
    }

    // Fetch student forms
    const forms = await sequelize.query(
      `SELECT id, photo
       FROM student_forms
       WHERE id IN (:ids)
       AND school_id = :school_id`,
      {
        replacements: {
          ids: student_form_ids,
          school_id,
        },
        type: QueryTypes.SELECT,
        transaction: t,
      }
    );

    if (forms.length !== student_form_ids.length) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Some student forms not found",
      });
    }

    // Photo check: Sabhi selected students ki photo hona zaroori hai
    const noPhoto = forms.filter(f => !f.photo);
    if (noPhoto.length > 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Please upload photos for all students",
        missing_forms: noPhoto.map(f => f.id),
      });
    }

    // Update status to 'pending' for ID generation
    await sequelize.query(
      `UPDATE student_forms
       SET status = 'pending',
           teacher_id = :teacher_id,
           updated_at = NOW()
       WHERE id IN (:ids)`,
      {
        replacements: {
          ids: student_form_ids,
          teacher_id,
        },
        type: QueryTypes.UPDATE,
        transaction: t,
      }
    );

    await t.commit();

    res.status(200).json({
      success: true,
      message: "Students submitted for ID card generation",
      submitted_count: student_form_ids.length,
      template_id: template_id || null,
    });
  } catch (error) {
    if (t) await t.rollback();
    console.error("Error submitting for ID generation:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while submitting for ID generation",
    });
  }
};