const express = require("express");
const router = express.Router();

const {
  addCredit,
  deductCredit,
  editCredit,
  getCredit,
  getCreditHistory,
  getTrustMessagesForSuperAdmin,
  updateTrustMessageStatus,
} = require("../controllers/trustCreditController");

const { verifySuperAdmin } = require("../middleware/authMiddleware");

// ADD CREDIT (trust_id required)
router.post("/trust/:trust_id/credit", verifySuperAdmin, addCredit);

// DEDUCT CREDIT (trust_id required)
router.post("/trust/:trust_id/deduct-credit", verifySuperAdmin, deductCredit);

// EDIT CREDIT (trust_id required)
router.patch("/trust/:trust_id/credit", verifySuperAdmin, editCredit);

// GET CURRENT CREDIT (NO trust_id)
router.get("/trust/credit", verifySuperAdmin, getCredit);

// GET CREDIT HISTORY (NO trust_id)
router.get("/trust/credit/history", verifySuperAdmin, getCreditHistory);

// GET TRUST MESSAGES
router.get("/superadmin/trust-messages", verifySuperAdmin, getTrustMessagesForSuperAdmin);

// UPDATE TRUST MESSAGE STATUS
router.patch("/superadmin/trust-messages/:id/status", verifySuperAdmin, updateTrustMessageStatus);

module.exports = router;
