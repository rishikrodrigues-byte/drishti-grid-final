export async function analyzeRoadImage(base64Data: string) {
  const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const body = {
    contents: [{
      parts: [
        { text: "Analyze road surface. Return ONLY JSON: {\"type\":\"pothole\"|\"crack\"|\"dig\"|\"normal\", \"severity\":1-5, \"repair_action\":\"string\", \"bitumen_kg\":number, \"hazard\":boolean}" },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data.includes(",") ? base64Data.split(",")[1] : base64Data
          }
        }
      ]
    }],
    generationConfig: { responseMimeType: "application/json" }
  };

  try {
    const res = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    const text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text);
  } catch (error) {
    console.error("AI_FAIL:", error);
    return { type: "normal", severity: 0, repair_action: "Scanning...", bitumen_kg: 0, hazard: false };
  }
}