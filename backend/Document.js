
const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    originalName: {
      type: String,
      required: true
    },

    fileName: {
      type: String,
      required: true
    },

    filePath: {
      type: String,
      required: true
    },

    fileSize: {
      type: Number,
      required: true
    },

    mimeType: {
      type: String,
      default: "application/pdf"
    },

    extractedText: {
      type: String,
      default: "",
      select: false
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Document", documentSchema);
