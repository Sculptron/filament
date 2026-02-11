export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
  
    const { prompt } = req.body;
  
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }
  
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: `You are a cinematic thematic analyst. You identify deep thematic connections between films and TV shows — not surface-level genre tags, but the underlying feelings, mythologies, settings, and emotional textures that connect stories.
  
  When given a movie/show title OR a mood description, return ONLY valid JSON (no markdown, no backticks, no preamble) in this exact format:
  {
    "themes": [
      { "id": "theme_key", "name": "Human Readable Theme Name" }
    ],
    "movies": [
      {
        "id": 1,
        "title": "Movie Title",
        "year": 2020,
        "type": "Film or TV",
        "themes": ["theme_key1", "theme_key2"],
        "desc": "One paragraph description.",
        "vibe": "One evocative sentence pitch — the kind of thing a film-obsessed friend would say to convince you to watch it."
      }
    ]
  }
  
  Rules:
  - Generate 4-6 unique thematic threads (not standard genres — think "expedition into the unknowable" not "sci-fi")
  - Return 8-12 movies/shows total. The first entry should be the searched title if one was given.
  - Each movie should connect to 2-4 themes
  - Include a mix of well-known and hidden gems
  - The "vibe" should be punchy, evocative, and personal — like a recommendation from someone who truly gets cinema
  - Make every theme connect at least 2 movies
  - Only return real movies and shows that actually exist with correct years
  - theme ids should be lowercase with underscores`,
          messages: [{ role: "user", content: prompt }]
        })
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        console.error("Anthropic API error:", data);
        return res.status(500).json({ error: "Failed to get response from AI" });
      }
  
      // Extract the text content and parse as JSON
      const text = data.content.map(item => item.text || "").join("");
      const clean = text.replace(/```json|```/g, "").trim();
      const result = JSON.parse(clean);
  
      return res.status(200).json(result);
  
    } catch (error) {
      console.error("Server error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }