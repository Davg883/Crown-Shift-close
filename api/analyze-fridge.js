const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Gemini client using environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async function handler(req, res) {
  // Set CORS headers for Vercel deployment
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image, fridgeType } = req.body;
    if (!image) {
      return res.status(400).json({ error: "No image data provided" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured in Vercel environment variables." });
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

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text().trim();

    console.log(`[AI Analysis] Fridge: ${fridgeType} | Raw response:`, responseText);

    // Safely parse out JSON response payload (strip any accidental markdown fences)
    const cleaned = responseText.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    const stockData = JSON.parse(cleaned);

    return res.status(200).json({ success: true, stock: stockData });
  } catch (error) {
    console.error("AI Analysis Engine Error:", error.message || error);
    return res.status(500).json({ error: "Failed to process visual analysis. " + (error.message || "") });
  }
};
