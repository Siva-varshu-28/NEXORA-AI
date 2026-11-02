
const Document = require("../models/Document");
const extractPdfText = require("../services/pdfService");
const generateAIResponse = require("../services/aiService");

// AI Question Answering
const askDocumentQuestion = async (req, res) => {
  try {
    const { documentId, question } = req.body;

    if (!documentId || !question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Document ID and question are required"
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      uploadedBy: req.user._id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    const extractedText = await extractPdfText(document.filePath);

    if (!extractedText) {
      return res.status(400).json({
        success: false,
        message: "No readable text found in this PDF"
      });
    }

    const prompt = `
You are NEXORA AI, an intelligent document assistant.

Answer the user's question using only the information in the document.
If the answer is unavailable, clearly say so.
Do not invent information.

DOCUMENT:
${extractedText.substring(0, 12000)}

QUESTION:
${question}

Provide a clear and helpful answer.
`;

    const answer = await generateAIResponse(prompt);

    res.status(200).json({
      success: true,
      message: "AI answer generated successfully",
      answer
    });

  } catch (error) {
    console.error("AI question error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to generate AI answer"
    });
  }
};

// AI Document Summary
const summarizeDocument = async (req, res) => {
  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: "Document ID is required"
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      uploadedBy: req.user._id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    const extractedText = await extractPdfText(document.filePath);

    if (!extractedText) {
      return res.status(400).json({
        success: false,
        message: "No readable text found in this PDF"
      });
    }

    const prompt = `
You are NEXORA AI, an intelligent document summarization assistant.

Analyze the document below and create a professional summary.

Include:
1. Overview
2. Main points
3. Important details
4. Skills or key topics (if applicable)
5. Final conclusion

Use clear headings and bullet points.
Only use information from the document.
Do not invent facts.

DOCUMENT:
${extractedText.substring(0, 12000)}
`;

    const summary = await generateAIResponse(prompt);

    res.status(200).json({
      success: true,
      message: "Document summary generated successfully",
      summary
    });

  } catch (error) {
    console.error("AI summary error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to generate document summary"
    });
  }
};

module.exports = {
  askDocumentQuestion,
  summarizeDocument
};
