const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { QueryTypes } = require("sequelize");
const sequelize = require("../../config/db");

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "student-photo-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter to accept only images
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

// Upload single student photo
exports.uploadStudentPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Photo file is required",
      });
    }

    const { student_id } = req.body;
    const { school_id, class_id, division_id } = req.user;

    if (!student_id) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    // Verify student belongs to teacher's class/division
    const student = await sequelize.query(
      `SELECT id, name, roll_number FROM students 
       WHERE id = :student_id 
       AND school_id = :school_id 
       AND class_id = :class_id 
       AND division_id = :division_id`,
      {
        replacements: { student_id, school_id, class_id, division_id },
        type: QueryTypes.SELECT,
      }
    );

    if (!student || student.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found or does not belong to your class",
      });
    }

    // Update student photo in database
    const photoUrl = `/uploads/${req.file.filename}`;
    const fullPhotoUrl = `${process.env.BACKEND_URL || "http://localhost:5000"}${photoUrl}`;

    await sequelize.query(
      `UPDATE students SET photo = :photo_url, updated_at = NOW() 
       WHERE id = :student_id`,
      {
        replacements: { photo_url: fullPhotoUrl, student_id },
        type: QueryTypes.UPDATE,
      }
    );

    res.status(200).json({
      success: true,
      message: "Photo uploaded successfully",
      photo_url: fullPhotoUrl,
      photo: fullPhotoUrl,
      student_id: parseInt(student_id),
    });
  } catch (error) {
    console.error("Error uploading student photo:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while uploading photo",
    });
  }
};

// Submit students for ID card generation
exports.submitForIDGeneration = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { students, template_id } = req.body;
    const { school_id, class_id, division_id } = req.user;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Students array is required",
      });
    }

    // Verify all students belong to teacher's class/division
    const studentIds = students.map((s) => s.student_id);
    const dbStudents = await sequelize.query(
      `SELECT id, name, roll_number, photo FROM students 
       WHERE id IN (:student_ids) 
       AND school_id = :school_id 
       AND class_id = :class_id 
       AND division_id = :division_id`,
      {
        replacements: { student_ids: studentIds, school_id, class_id, division_id },
        type: QueryTypes.SELECT,
        transaction: t,
      }
    );

    if (dbStudents.length !== students.length) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Some students not found or do not belong to your class",
      });
    }

    // Check if students have photos
    const studentsWithoutPhotos = dbStudents.filter((s) => !s.photo);
    if (studentsWithoutPhotos.length > 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Please upload photos for ${studentsWithoutPhotos.length} student(s)`,
        missing_photos: studentsWithoutPhotos.map((s) => ({
          student_id: s.id,
          name: s.name,
          roll_number: s.roll_number,
        })),
      });
    }

    // Get class and school info
    const classInfo = await sequelize.query(
      `SELECT c.class_name, s.trust_id FROM classes c
       JOIN schools s ON c.school_id = s.id
       WHERE c.id = :class_id`,
      {
        replacements: { class_id },
        type: QueryTypes.SELECT,
        transaction: t,
      }
    );

    if (!classInfo || classInfo.length === 0) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const trustId = classInfo[0].trust_id;

    // Create student_forms entries for each student
    const formEntries = [];
    for (const student of dbStudents) {
      const studentData = students.find((s) => s.student_id === student.id);
      
      // Check if form already exists
      const existingForm = await sequelize.query(
        `SELECT id FROM student_forms 
         WHERE school_id = :school_id 
         AND class_id = :class_id 
         AND roll_number = :roll_number`,
        {
          replacements: {
            school_id,
            class_id,
            roll_number: student.roll_number,
          },
          type: QueryTypes.SELECT,
          transaction: t,
        }
      );

      if (existingForm.length > 0) {
        // Update existing form
        await sequelize.query(
          `UPDATE student_forms 
           SET photo = :photo, status = 'pending', updated_at = NOW()
           WHERE id = :form_id`,
          {
            replacements: {
              photo: studentData.photo || student.photo,
              form_id: existingForm[0].id,
            },
            type: QueryTypes.UPDATE,
            transaction: t,
          }
        );
        formEntries.push(existingForm[0].id);
      } else {
        // Create new form entry
        const [formResult] = await sequelize.query(
          `INSERT INTO student_forms (
            school_id, class_id, division_id, teacher_id, roll_number,
            first_name, last_name, gender, photo, status, created_at, updated_at
          ) VALUES (
            :school_id, :class_id, :division_id, :teacher_id, :roll_number,
            :first_name, :last_name, :gender, :photo, 'pending', NOW(), NOW()
          ) RETURNING id`,
          {
            replacements: {
              school_id,
              class_id,
              division_id,
              teacher_id: req.user.id,
              roll_number: student.roll_number,
              first_name: student.name.split(" ")[0] || student.name,
              last_name: student.name.split(" ").slice(1).join(" ") || "",
              gender: student.gender || "N/A",
              photo: studentData.photo || student.photo,
            },
            type: QueryTypes.INSERT,
            transaction: t,
          }
        );
        formEntries.push(formResult[0].id);
      }
    }

    await t.commit();

    res.status(200).json({
      success: true,
      message: `${students.length} students submitted for ID card generation`,
      submitted_count: students.length,
      template_id: template_id || null,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error submitting for ID generation:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while submitting for ID generation",
    });
  }
};

// Export multer upload middleware
exports.upload = upload.single("photo");

