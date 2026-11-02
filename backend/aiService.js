
const axios = require("axios");

const generateAIResponse = async (prompt, options = {}) => {
  try {
    const requestData = {
      model: "llama3.2:1b",
      prompt,
      stream: false
    };

    // Enable JSON mode only when specifically requested
    if (options.format === "json") {
      requestData.format = "json";
    }

    const response = await axios.post(
      "http://localhost:11434/api/generate",
      requestData,
      {
        timeout: 120000
      }
    );

    return response.data.response;

  } catch (error) {
    console.error("Ollama AI Error:", error.message);
    throw new Error("AI service is currently unavailable");
  }
};

module.exports = generateAIResponse;
