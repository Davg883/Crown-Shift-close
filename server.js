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

    let fridgeProfile = "";
    if (fridgeType === "mixer" || fridgeType === "fridge1") {
      fridgeProfile = `
  FRIDGE TYPE: Mixers & Softs (Mixer Fridge)
  - Target inventory items: Thatchers Zero, Doom Bar Zero, Old Mout Cider, Diet Coke, Coca-Cola, Fanta, Schweppes Tonic/Slimline, Monster Energy (Punch), Monster Energy (Mango), Monster Energy (Original), Monster Energy (Ultra).`;
    } else if (fridgeType === "beer" || fridgeType === "fridge2") {
      fridgeProfile = `
  FRIDGE TYPE: Bottled Beers & Alcopops (Beer Fridge)
  - Target inventory items: VK (Blue), VK (Ice), VK (Orange), Stella Artois, Birra Moretti, Desperados, Old Speckled Hen, Magners.
  - GLARE OVERRIDE DIRECTIVE: Clear glass (Desperados) and reflective white necks (Stella) create high-contrast bright spots. Treat these solid lines of light reflections as FULL rows (Restock: 0) instead of empty background spaces.`;
    } else if (fridgeType === "wine" || fridgeType === "fridge3") {
      fridgeProfile = `
  FRIDGE TYPE: Wine & Premium (Wine/Premium Fridge)
  - Virtual boundary grid:
    * Top/Middle Shelves contain: BrewDog Punk IPA, Smirnoff Ice, WKD Blue, Thatchers Haze, Jägermeister (Max Capacity per row: 6)
    * Bottom Shelf contains single-serve mini wines: White Wine (Mini), Rosé Wine (Mini), Red Wine (Mini) (Max Capacity per row: 8)`;
    }

    const prompt = `
  You are an advanced industrial inventory vision engine trained specifically for commercial bar setups.
  Analyze the provided image of the "${fridgeType}" fridge.
  ${fridgeProfile}

  CRITICAL VISION DIRECTIVES FOR 2D IMAGES:
  1. DO NOT try to count individual bottles going backward into the dark shelves.
  2. Instead, focus EXCLUSIVELY on the FRONT ROW line of bottles/cans to determine row fullness. Ignore dark depth.
  3. Look for "GAPING HOLES" (empty floor mat space) or "TIPPED OVER / MISSING" silhouettes in the front row line to estimate the restock quantity.
  4. If a specific brand row is solidly packed left-to-right to the glass, Restock Needed is 0.
  5. If you spot 1 or 2 distinct gaps in the front row line, Restock Needed is 1 or 2.

  You MUST strictly output a JSON object containing ONLY the keys provided in the array below. Match the spelling exactly. Estimate the restock quantity (0 to 8) based on front-row gaps and shelf capacities.

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
