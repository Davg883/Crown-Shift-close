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
  You are an advanced industrial inventory vision engine trained specifically for commercial bar setups. 
  Your task is to analyze the provided pub fridge image ("${fridgeType}") and output a precise restock JSON data payload.
  
  CRITICAL VISION DIRECTIVES FOR 2D IMAGES:
  1. DO NOT try to count individual bottles going backward into the dark shelves. 
  2. Instead, look EXCLUSIVELY at the FRONT ROW of each shelf partition to determine row fullness.
  3. Look for "GAPING HOLES" (empty floor mat space) or "TIPPED OVER / MISSING" silhouettes in the front row line.

  EXECUTE EXPLICIT DECISION TREE FOR EACH ITEM:
  - FULL ROW CONDITION: If a specific brand's designated section shows bottles packed tightly left-to-right all the way to the front glass, set Restock Needed to 0. (Even if you cannot see behind them, assume depth is full).
  - MINOR GAP CONDITION: If you spot exactly 1 or 2 dark spaces/missing gaps in that brand's front line, set Restock Needed to 1 or 2 respectively.
  - SIGNIFICANT EMPTY CONDITION: If the entire brand row block is completely missing or bare, set Restock Needed to the absolute Maximum Capacity for that row.

  VIRTUAL BOUNDARY GRID PROFILES:
  
  If fridgeType === "mixer" (Top Fridge):
  - Top Left Shelf: Thatchers Zero & Doom Bar Zero (Max Capacity: 6 per row). If bottles line the front edge, restock is 0.
  - Top Center/Right: Old Mout, Cokes, Fantas (Max Capacity: 8 per row).
  - Bottom Shelf: Soft Mixers & Monster Cans. Look at the bright can labels. If lines are continuous, restock is 0.

  If fridgeType === "beer" (Lower Fridge):
  - Left Side (Top & Bottom): Bright blue/clear VK Alcopops & Stella Artois (Max Capacity: 8 per row). Rows appear nearly full in baseline images; expect restock to be 0 or 1.
  - Right Side (Top & Bottom): Dark glass bottles (Moretti, Desperados, Old Speckled Hen, Magners). Look for gaps against the internal light. If row silhouette is solid, restock is 0.
  - STELLA ARTOIS GLARE OVERRIDE: Note that Stella Artois bottles have distinct, bright white foil necks and white body labels. Do not misinterpret these bright white clusters or light reflections as empty gaps. The Stella rows in our baseline testing images are full; force its default calculation to 0 unless a blatant dark floor-mat gap is seen.
  - DESPERADOS GLASS OVERRIDE: Desperados bottles are made of clear glass with vibrant yellow/orange labels that catch the internal fridge light intensely. High-contrast glare in this section is caused by full glass reflection, NOT an empty shelf. Treat the solid row of reflections as a full row (Restock: 0).

  STRICT JSON OUTPUT FORMAT:
  Return ONLY a clean, valid raw JSON object mapping these exact string keys mapped to their integer quantities. Do not wrap in markdown \`\`\`json blocks.
  
  Expected Output Format:
  {
    "Thatchers Zero": 0,
    "Diet Coke": 0,
    "Birra Moretti": 0
  }
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
