export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { prompt } = req.body;
    if (!prompt) {
      return res.status(200).json({ teasers: null });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: `You are a film analyst. Given a movie query or viewing mood, return ONLY valid JSON (no markdown, no backticks, no preamble) with 5 short, clear, intriguing one-line teasers about films you'd recommend.

Format: { "teasers": ["teaser1...", "teaser2...", ...] }

Rules:
- Each teaser: 8-15 words max
- Be concrete: mention a place, a person, a visual, a surprising detail
- Avoid flowery or abstract language — be specific and vivid
- Build curiosity — make the reader think "I want to see that"
- End each with "..."
- Do NOT include film titles or director names
- Write like a friend giving an exciting hint, not a critic writing a review`,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Teasers API error:", response.status, JSON.stringify(data).slice(0, 300));
      return res.status(200).json({ teasers: null });
    }

    if (!data.content || !Array.isArray(data.content)) {
      console.error("Teasers unexpected shape:", JSON.stringify(data).slice(0, 300));
      return res.status(200).json({ teasers: null });
    }

    const text = data.content.map((item) => item.text || "").join("");
    const clean = text.replace(/```json|```/g, "").trim();

    console.log("Teasers raw response:", clean.slice(0, 300));

    const parsed = JSON.parse(clean);

    if (!parsed.teasers || !Array.isArray(parsed.teasers)) {
      console.error("Teasers missing array in parsed JSON");
      return res.status(200).json({ teasers: null });
    }

    console.log("Teasers success:", parsed.teasers.length, "items");
    return res.status(200).json({ teasers: parsed.teasers });
  } catch (err) {
    console.error("Teasers catch-all error:", err.message || err);
    return res.status(200).json({ teasers: null });
  }
}
