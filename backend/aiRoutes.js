
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  askDocumentQuestion,
  summarizeDocument
} = require("../controllers/aiController");

// Ask questions about uploaded PDF
router.post("/ask", protect, askDocumentQuestion);

// Generate AI document summary
router.post("/summarize", protect, summarizeDocument);

module.exports = router;
