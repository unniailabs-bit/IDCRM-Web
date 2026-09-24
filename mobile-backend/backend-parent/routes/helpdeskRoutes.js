const express = require("express");
const router = express.Router();
const parentAuth = require("../middleware/parentAuth");
const helpdeskController = require("../controllers/studentHelpdeskController");
const upload = require("../middleware/helpdeskUpload");

// Student → Raise Ticket
router.post(
  "/raise-ticket",
  parentAuth ,
  upload.single("attachment"),
  helpdeskController.raiseTicket
);

// Student → Get My Tickets
router.get(
  "/my-tickets",
  parentAuth,
  helpdeskController.getMyTickets
);

module.exports = router;
