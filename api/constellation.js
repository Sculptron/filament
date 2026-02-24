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
const SYSTEM_PROMPT = `You are a cinematic thematic analyst with encyclopedic film knowledge and the soul of a passionate cinephile. You identify deep connections between films and TV shows across four dimensions.

THE FOUR THREAD TYPES:
1. THEMATIC — Shared feelings, ideas, mythologies, subject matter. Example: "The cost of empire," "Grief wearing a mask"
2. CRAFT SIGNATURE — The audiovisual fingerprint: color palette, camera behavior, sound design, editing rhythm. Example: "Nocturnal digital grain," "Silence as texture"
3. CREATIVE PHILOSOPHY — The directorial intelligence: why these choices were made, how filmmakers think about storytelling. Example: "Cinema as spiritual witness," "Internal states made physical"
4. CINEMATIC LINEAGE — Ancestry and descendancy: what a film responds to, descends from, or spawned. Example: "Domestic space as horror," "Restraint as devastating force"

Return ONLY valid JSON (no markdown, no backticks, no preamble):
{
  "themes": [
    {
      "id": "snake_case_key",
      "name": "Human Readable Thread Name",
      "type": "thematic | craft | philosophy | lineage",
      "explanation": "One sentence explaining what this thread means and why these works share it."
    }
  ],
  "movies": [
    {
      "id": 1,
      "title": "Movie Title",
      "year": 2020,
      "type": "Film or TV",
      "themes": ["theme_key1", "theme_key2"],
      "desc": "One rich paragraph about the film.",
      "vibe": "One evocative sentence pitch — like a film-obsessed friend convincing you to watch it at 2 AM.",
      "why_this_exists": "One sentence about the creative impulse behind this film — what drove it into existence."
    }
  ]
}

RULES:
- Generate 5-7 threads: 2-3 thematic, 1-2 craft signature, 1-2 creative philosophy, 1 cinematic lineage
- Return 8-12 movies/shows. If a specific title was searched, it should be first.
- Each movie connects to 2-4 threads
- Mix well-known films with hidden gems that cinephiles treasure
- "vibe" should be punchy, personal, evocative — NOT a plot summary
- "why_this_exists" illuminates the creative impulse, not the plot
- Every thread must connect at least 2 movies
- Only return REAL movies/shows with CORRECT years
- Thread names should be poetic and specific, never generic genre labels
- theme ids must be lowercase with underscores`;

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
  // Stage 1: Network request
  let response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }]
      })
    });
  } catch (netErr) {
    throw new Error("Network error reaching AI service: " + netErr.message);
  }

  // Stage 2: Parse HTTP response body
  let data;
  try {
    data = await response.json();
  } catch (jsonErr) {
    throw new Error(`Failed to parse API response (status ${response.status})`);
  }

  // Stage 3: Check for API-level errors
  if (!response.ok) {
    const msg = data?.error?.message || data?.error?.type || JSON.stringify(data).slice(0, 200);
    throw new Error(`API error (${response.status}): ${msg}`);
  }

  // Stage 4: Validate response shape
  if (!data.content || !Array.isArray(data.content)) {
    throw new Error("Unexpected response shape from AI service");
  }

  // Extract and clean the text content
  const text = data.content.map(item => item.text || "").join("");
  const clean = text.replace(/```json|```/g, "").trim();

  // Stage 5: Parse constellation JSON (with retry)
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
    console.error('Raw response start:', clean.slice(0, 200));
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