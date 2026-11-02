
const Document = require("../models/Document");
const fs = require("fs");
const path = require("path");

// UPLOAD DOCUMENT
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a PDF file"
      });
    }

    const document = await Document.create({
      title: path.parse(req.file.originalname).name,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: "PDF uploaded successfully",
      document: {
        id: document._id,
        title: document.title,
        originalName: document.originalName,
        fileSize: document.fileSize,
        uploadedAt: document.createdAt
      }
    });

  } catch (error) {
    // Remove uploaded file if database save fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET USER DOCUMENTS
const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({
      uploadedBy: req.user._id
    })
      .select("-extractedText -filePath")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: documents.length,
      documents
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// DELETE DOCUMENT
const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      uploadedBy: req.user._id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    await document.deleteOne();

    res.status(200).json({
      success: true,
      message: "Document deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  deleteDocument
};
