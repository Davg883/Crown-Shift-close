require("dotenv").config();
const express = require("express");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the project root
app.use(express.static(__dirname));

// Parse JSON bodies up to 10MB for base64 image payloads
app.use(express.json({ limit: "10mb" }));

// Initialize the Gemini client using the environment variable
const aiEngineInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
        FRIDGE PROFILE MATRIX: Wine & Premium Craft Items (High-Angle Capture).
        Note: The source image for this fridge is shot from a top-down, high-angle perspective. 
        
        CRITICAL SHADOW CALIBRATION OVERRIDES:
        - TOP & MIDDLE SHELF HEADSPACE: Because of the steep downward angle, the black fridge frame and upper shelf dividers cast intense, deep shadows over the tops of the cans (Punk IPA) and bottle caps (Smirnoff Ice, WKD, Thatchers Haze, Jägermeister). DO NOT interpret this dark upper headspace as an empty shelf or a gap. 
        - Look strictly down at the vertical bodies of the cans and bottles. If you see a solid wall of colorful labels running left-to-right, the row is FULL. Set Restock Needed to 0.
        - BOTTOM SHELF (MINI WINES): These small single-serve wine bottles are tightly lined up against the front glass. A solid row of white, pink, and dark red liquids means the shelf is full (Restock Needed: 0). Only flag a restock value if a physical gap reveals the empty white grid shelf mat underneath.
    `;
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

    const inferenceResponse = await aiEngineInstance.models.generateContent({
        model: "gemini-2.5-flash", // Ready for swapping to custom fine-tuned model endpoints
        contents: [
            {
                inlineData: {
                    mimeType: "image/jpeg",
                    data: base64Data
                }
            },
            prompt
        ],
        config: {
            // Core Architectural Tuning Parameter Injections
            mediaResolution: "MEDIA_RESOLUTION_HIGH",
            thinkingLevel: "MINIMAL",
            stopSequences: ["\n}"],
            temperature: 0.0 // Ensure strict deterministic outputs
        }
    });

    const rawResponseText = inferenceResponse.text.trim();

    console.log(`[AI Analysis] Fridge: ${fridgeType} | Raw response:`, rawResponseText);

    // Safeguard check: If the model natively outputted backticks before cutting off, handle it gracefully, otherwise parse directly.
    let processedCleanJson = rawResponseText;
    if (rawResponseText.includes("```")) {
        processedCleanJson = rawResponseText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    // Hardened cutoff closure: Ensure JSON closes cleanly if stop sequence truncated the terminal brace
    if (!processedCleanJson.endsWith("}")) {
        processedCleanJson += "\n}";
    }

    try {
        const stockData = JSON.parse(processedCleanJson);
        res.json(stockData);
    } catch (parseError) {
        console.error("JSON Clean Stream Parsing Error. Content received:", rawResponseText);
        res.status(500).json({ error: "Failed to parse hardened token output matrix" });
    }
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
