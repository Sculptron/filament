import { createClient } from '@supabase/supabase-js';

// ============================================================
// SUPABASE ADMIN CLIENT
// ============================================================
// Uses service role key for full database access (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// ============================================================
// SYSTEM PROMPT FOR CLAUDE
// ============================================================
const SYSTEM_PROMPT = `You are a cinematic thematic analyst. You identify deep thematic connections between films and TV shows — not surface-level genre tags, but the underlying feelings, mythologies, settings, and emotional textures that connect stories.

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
- theme ids should be lowercase with underscores`;

// ============================================================
// HELPER: Get client IP address
// ============================================================
function getClientIp(req) {
  // Vercel provides the real IP in x-forwarded-for or x-real-ip headers
  return req.headers['x-forwarded-for']?.split(',')[0].trim()
    || req.headers['x-real-ip']
    || req.connection?.remoteAddress
    || 'unknown';
}

// ============================================================
// HELPER: Generate unique share ID
// ============================================================
function generateShareId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ============================================================
// HELPER: Check rate limit (5 searches per 24 hours per IP)
// ============================================================
async function checkRateLimit(ipAddress) {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from('search_logs')
    .select('id')
    .eq('ip_address', ipAddress)
    .gte('created_at', twentyFourHoursAgo);

  if (error) {
    console.error('Rate limit check error:', error);
    return { allowed: true, count: 0 }; // Fail open (allow on error)
  }

  const searchCount = data.length;
  const allowed = searchCount < 5;

  return { allowed, count: searchCount, limit: 5 };
}

// ============================================================
// HELPER: Call Claude API with retry logic
// ============================================================
async function callClaudeAPI(prompt, retryCount = 0) {
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
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${JSON.stringify(data)}`);
  }

  // Extract and clean the text content
  const text = data.content.map(item => item.text || "").join("");
  const clean = text.replace(/```json|```/g, "").trim();

  // Try to parse JSON
  try {
    const result = JSON.parse(clean);

    // Validate structure
    if (!result.themes || !result.movies || !Array.isArray(result.themes) || !Array.isArray(result.movies)) {
      throw new Error('Invalid constellation structure');
    }

    return { success: true, data: result };
  } catch (parseError) {
    // If this is the first attempt and parsing failed, retry once
    if (retryCount === 0) {
      console.warn('JSON parse failed on first attempt, retrying...', parseError.message);
      return callClaudeAPI(prompt, 1);
    }

    // Second attempt also failed
    console.error('JSON parse failed after retry:', parseError.message);
    console.error('Raw response:', clean);
    return {
      success: false,
      error: 'The AI returned an invalid response. Please try again.'
    };
  }
}

// ============================================================
// MAIN HANDLER
// ============================================================
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, searchType = 'title' } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const ipAddress = getClientIp(req);

  try {
    // ============================================================
    // STEP 1: Check rate limit
    // ============================================================
    const rateLimitCheck = await checkRateLimit(ipAddress);

    if (!rateLimitCheck.allowed) {
      return res.status(429).json({
        error: `Daily search limit reached. You've used ${rateLimitCheck.count} of ${rateLimitCheck.limit} searches. Try again in 24 hours.`,
        rateLimitExceeded: true,
        count: rateLimitCheck.count,
        limit: rateLimitCheck.limit
      });
    }

    // ============================================================
    // STEP 2: Call Claude API (with retry logic)
    // ============================================================
    const apiResult = await callClaudeAPI(prompt);

    if (!apiResult.success) {
      return res.status(500).json({ error: apiResult.error });
    }

    const constellation = apiResult.data;

    // ============================================================
    // STEP 3: Save constellation to database
    // ============================================================
    const shareId = generateShareId();

    const { data: savedConstellation, error: saveError } = await supabaseAdmin
      .from('constellations')
      .insert({
        search_query: prompt,
        search_type: searchType,
        constellation_data: constellation,
        share_id: shareId
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save constellation:', saveError);
      // Don't fail the request if save fails, just log it
    }

    // ============================================================
    // STEP 4: Log the search (for analytics and rate limiting)
    // ============================================================
    const { error: logError } = await supabaseAdmin
      .from('search_logs')
      .insert({
        ip_address: ipAddress,
        session_id: req.headers['x-vercel-id'] || null,
        search_type: searchType,
        query_text: prompt,
        constellation_id: savedConstellation?.id || null
      });

    if (logError) {
      console.error('Failed to log search:', logError);
      // Don't fail the request if logging fails
    }

    // ============================================================
    // STEP 5: Return constellation with metadata
    // ============================================================
    return res.status(200).json({
      ...constellation,
      shareId: shareId,
      searchesRemaining: 5 - (rateLimitCheck.count + 1)
    });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      error: "Something went wrong while generating your constellation. Please try again."
    });
  }
}