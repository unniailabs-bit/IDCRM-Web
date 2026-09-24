const express = require("express");
const router = express.Router();

// Auth middleware (JWT verify)
const { verifySchoolAdmin } = require("../middleware/authMiddleware");

//Logo upload middleware
const schoolLogoUpload = require("../middleware/schoolLogoUpload");

//Controllers
const {
  createSchoolLogo,
  getSchoolLogo,
  updateSchoolLogo,
  deleteSchoolLogo,
} = require("../controllers/schoolLogoController");

// =======================
// CREATE (POST)
// =======================
router.post(
  "/:school_id/logo",
  verifySchoolAdmin,                 
  schoolLogoUpload.single("logo"),   
  createSchoolLogo                   
);


router.get(
  "/:school_id/logo",
  verifySchoolAdmin,
  getSchoolLogo
);

router.patch(
  "/:school_id/logo",
  verifySchoolAdmin,
  schoolLogoUpload.single("logo"),
  updateSchoolLogo
);


router.delete(
  "/:school_id/logo",
  verifySchoolAdmin,
  deleteSchoolLogo
);

module.exports = router;
