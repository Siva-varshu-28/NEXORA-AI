
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  uploadDocument,
  getDocuments,
  deleteDocument
} = require("../controllers/documentController");

// Upload PDF
router.post(
  "/upload",
  protect,
  upload.single("document"),
  uploadDocument
);

// Get all user documents
router.get("/", protect, getDocuments);

// Delete document
router.delete("/:id", protect, deleteDocument);

module.exports = router;
