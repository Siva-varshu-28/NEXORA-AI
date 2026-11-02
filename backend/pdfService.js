
const fs = require("fs");
const { PDFParse } = require("pdf-parse");

const extractPdfText = async (filePath) => {
  let parser;

  try {
    const fileBuffer = fs.readFileSync(filePath);

    parser = new PDFParse({
      data: fileBuffer
    });

    const result = await parser.getText();

    return result.text.trim();

  } catch (error) {
    console.error("PDF extraction error:", error.message);
    throw new Error("Unable to extract PDF text");

  } finally {
    if (parser) {
      await parser.destroy();
    }
  }
};

module.exports = extractPdfText;
