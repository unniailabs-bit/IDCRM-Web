const express = require("express");
const router = express.Router();

const teacherAuth = require("../middleware/authmiddleware");
const {
  uploadMaterials,
  getMaterials,
  getTeacherSubjects,
  updateMaterial,
  deleteMaterial
} = require("../controllers/materialController");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// --------------------
// Upload Directory
// --------------------
const materialsDir = path.join(__dirname, "../../uploads/materials");

if (!fs.existsSync(materialsDir)) {
  fs.mkdirSync(materialsDir, { recursive: true });
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, materialsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});


const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB (videos ke liye)
  }
}).array("files", 10); 


router.post("/material",teacherAuth,upload,uploadMaterials);

router.get("/materials", teacherAuth, getMaterials);

router.get("/materials/subjects", teacherAuth, getTeacherSubjects);

router.patch("/material/update", teacherAuth, upload, updateMaterial);

router.delete("/material/delete/:id", teacherAuth, deleteMaterial);

module.exports = router;
