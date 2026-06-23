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
    const { image, fridgeType } = req.body;
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

    // System instruction defining maximum capacities matching the fridge profiles
    const prompt = `
      You are an expert inventory manager for a premium British hotel pub called The Crown Hotel. Analyze this bar fridge image carefully.
      
      Inventory Guidelines:
      - The fridge type being scanned is: "${fridgeType}".
      - Count only items visible that belong to this category.
      - Based on a baseline row depth and maximum capacity layout, figure out exactly how many items are missing/needed to restock the fridge to full capacity.
      
      Expected strictly matching item keys to output if missing:
      Mixers & Softs keys: "Thatchers Zero", "Doom Bar Zero", "Old Mout Cider", "Diet Coke", "Coca-Cola", "Fanta", "Schweppes Tonic/Slimline", "Monster Energy (Original)", "Monster Energy (Punch)", "Monster Energy (Mango)", "Monster Energy (Ultra)"
      Beer & Cider keys: "VK (Blue)", "VK (Ice)", "VK (Orange)", "Stella Artois", "Birra Moretti", "Desperados", "Old Speckled Hen", "Magners"

      Return ONLY a clean, valid JSON object mapping the exact string keys above to the integer quantity needed. Do not wrap the JSON in markdown code blocks or backticks. If the fridge is full or an item is fully stocked, return 0 for its value. Only include items relevant to the "${fridgeType}" fridge type.
      
      Example output:
      {
        "Schweppes Tonic/Slimline": 2,
        "Birra Moretti": 1
      }
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
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
