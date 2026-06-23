require("dotenv").config();
const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the project root
app.use(express.static(__dirname));

// Parse JSON bodies up to 10MB for base64 image payloads
app.use(express.json({ limit: "10mb" }));

// Initialize the Gemini client using the environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/analyze-fridge — AI Visual Analysis Endpoint
app.post("/api/analyze-fridge", async (req, res) => {
  try {
    const { image, fridgeType, currentUiKeys } = req.body;
    if (!image) return res.status(400).json({ error: "No image data provided" });

    // Verify API key is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_actual_gemini_api_key_here") {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured. Please set it in your .env file." });
    }

    // Clean base64 string metadata header if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg",
      },
    };

    const prompt = `
  You are an advanced industrial inventory vision engine for a commercial hotel pub.
  Analyze the provided image of the "${fridgeType}" fridge.
  
  CRITICAL VISION DIRECTIVES:
  1. Focus EXCLUSIVELY on the FRONT ROW line of bottles/cans to determine row fullness. Ignore dark depth.
  2. If a specific brand row is solidly packed left-to-right to the glass, Restock Needed is 0.
  3. If you spot 1 or 2 distinct gaps in the front row line, Restock Needed is 1 or 2.
  4. GLARE OVERRIDE: Clear glass (Desperados) and reflective white necks (Stella) create high-contrast bright spots. Treat these solid lines of light reflections as FULL rows (Restock: 0).

  You MUST strictly output a JSON object containing ONLY the keys provided in the array below. Match the spelling exactly. Estimate the restock quantity (0 to 8) based on front-row gaps.

  STRICT LIST OF VALID KEYS TO RETURN:
  ${JSON.stringify(currentUiKeys || [])}

  Return ONLY a clean, raw JSON object mapping these exact keys to their calculated integer restock values. Do not use markdown backticks or enclose in \`\`\`json blocks.
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text().trim();

    console.log(`[AI Analysis] Fridge: ${fridgeType} | Raw response:`, responseText);

    // Safely parse out JSON response payload (strip any accidental markdown fences)
    const cleaned = responseText.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    const stockData = JSON.parse(cleaned);

    res.json({ success: true, stock: stockData });
  } catch (error) {
    console.error("AI Analysis Engine Error:", error.message || error);
    res.status(500).json({ error: "Failed to process visual analysis. " + (error.message || "") });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🏨 Crown Hotel Closedown Server running at http://127.0.0.1:${PORT}`);
  console.log(`📡 AI Analysis endpoint: POST http://127.0.0.1:${PORT}/api/analyze-fridge`);
  console.log(`🔑 Gemini API Key: ${process.env.GEMINI_API_KEY ? "Configured ✓" : "NOT SET ✗"}\n`);
});
