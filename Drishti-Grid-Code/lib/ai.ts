export async function analyzeRoadImage(base64Data: string) {
  const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  // THE 2026 FREE-TIER FIX: Using the guaranteed Gemini 3 Flash Preview model
  const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;

  // NEW ADVANCED 3D VOLUME ESTIMATION PROMPT
  const promptText = `You are an expert Civil Engineering AI for the PWD. Analyze this road image.
If the road is normal, return exactly: {"type":"normal", "severity":0, "repair_action":"None", "bitumen_kg":0, "hazard":false}

If there is a defect (pothole, crack, dig), you MUST use Monocular Depth Estimation based on context (shadows, aggregate size, road lines) to estimate the physical dimensions in centimeters.

RULES FOR CALCULATION:
1. Standard Asphalt Density = 2.32 grams per cubic centimeter (cm³).
2. Volume (cm³) = est_width_cm * est_length_cm * est_depth_cm
3. Calculate base weight = (Volume cm³) * 2.32 / 1000 (to get KG).
4. Add a strict 15% safety/wastage margin to the final bitumen_kg.

Return ONLY a raw JSON object with this exact structure (no markdown, no backticks, just the brace):
{
  "type": "pothole" | "crack" | "dig" | "normal",
  "severity": 1-5,
  "repair_action": "Cut edges, clean, tack coat, and fill with hot-mix asphalt.",
  "est_width_cm": number,
  "est_length_cm": number,
  "est_depth_cm": number,
  "volume_cm3": number,
  "bitumen_kg": number,
  "margin_included": "15%",
  "hazard": boolean
}`;

  const body = {
    contents: [{
      parts:[
        { text: promptText },
        { 
          inlineData: { 
            mimeType: "image/jpeg", 
            data: base64Data.includes(",") ? base64Data.split(",")[1] : base64Data 
          } 
        }
      ]
    }]
  };

  try {
    const res = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No candidates returned from AI.");
    }

    const rawText = data.candidates[0].content.parts[0].text;
    
    // SURGICAL EXTRACTION: Rips JSON out of any text Gemini might add
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal AI Error";
    console.error("BRAIN_FAIL:", errorMessage);
    
    // We return type: "error" so the Edge Node knows NOT to save this to Firestore
    return { 
      type: "error", 
      severity: 0, 
      repair_action: `API Error: ${errorMessage}`, 
      bitumen_kg: 0, 
      hazard: false 
    };
  }
}