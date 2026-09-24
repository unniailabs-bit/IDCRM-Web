const express = require("express");
const router = express.Router();

const { verifySchoolAdmin } = require("../middleware/authMiddleware");
const principalSignUpload = require("../middleware/principalSignUpload");

const {
  createPrincipalSign,
  getPrincipalSign,
  updatePrincipalSign,
  deletePrincipalSign,
} = require("../controllers/principalSignController");

router.post(
  "/:school_id/principal-sign",
  verifySchoolAdmin,
  principalSignUpload.single("principal_sign"),
  createPrincipalSign
);

router.get(
  "/:school_id/principal-sign",
  verifySchoolAdmin,
  getPrincipalSign
);

router.patch(
  "/:school_id/principal-sign",
  verifySchoolAdmin,
  principalSignUpload.single("principal_sign"),
  updatePrincipalSign
);

router.delete(
  "/:school_id/principal-sign",
  verifySchoolAdmin,
  deletePrincipalSign
);

module.exports = router;
