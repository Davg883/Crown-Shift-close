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
      
      Your goal is to determine how many items are missing/needed to restock the fridge to its maximum capacity.
      
      Here are the maximum capacities for each item type in a fully stocked fridge:
      Mixers & Softs Fridge ("mixer"):
      - "Thatchers Zero": Max Capacity = 6
      - "Doom Bar Zero": Max Capacity = 6
      - "Old Mout Cider": Max Capacity = 6
      - "Diet Coke": Max Capacity = 10
      - "Coca-Cola": Max Capacity = 10
      - "Fanta": Max Capacity = 6
      - "Schweppes Tonic/Slimline": Max Capacity = 12
      - "Monster Energy (Original)": Max Capacity = 6
      - "Monster Energy (Punch)": Max Capacity = 6
      - "Monster Energy (Mango)": Max Capacity = 6
      - "Monster Energy (Ultra)": Max Capacity = 6

      Beer & Cider Fridge ("beer"):
      - "VK (Blue)": Max Capacity = 8
      - "VK (Ice)": Max Capacity = 8
      - "VK (Orange)": Max Capacity = 8
      - "Stella Artois": Max Capacity = 8
      - "Birra Moretti": Max Capacity = 8
      - "Desperados": Max Capacity = 8
      - "Old Speckled Hen": Max Capacity = 6
      - "Magners": Max Capacity = 6

      Inventory Counting Rules:
      1. ONLY analyze items for the fridge type specified: "${fridgeType}".
      2. For each item in the list above:
         - Estimate the number of bottles/cans CURRENTLY PRESENT (Visible in the front row + depth behind them).
         - Calculate: Restock Needed = Max Capacity - Present Count.
         - If a shelf row looks full/packed and you see bottles lining up to the front, the Present Count equals Max Capacity, so Restock Needed is 0.
         - Do NOT return the number of visible bottles as the restock count. For example, if you see 3 bottles of Birra Moretti and the row is half-empty, the Present Count is 3, meaning Restock Needed is 5 (8 - 3 = 5). If the Birra Moretti row is completely full, Restock Needed is 0.
         - If an item is completely missing from the fridge, Restock Needed is its full Max Capacity.
      
      Return ONLY a clean, valid JSON object mapping the exact string keys above to the integer quantity needed. Do not wrap the JSON in markdown code blocks or backticks.
      
      Example output:
      {
        "Schweppes Tonic/Slimline": 0,
        "Diet Coke": 2,
        "Birra Moretti": 5
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
