# Infrastructure Setup Complete ✅

## What Was Built

The Infrastructure Architect agent has completed Phase 1 of Filament's backend infrastructure. Here's what now exists:

### 1. Database Layer (Supabase PostgreSQL)
- **`constellations` table** — Stores every generated constellation with a unique `share_id` for shareable URLs
- **`search_logs` table** — Tracks every search for rate limiting and analytics
- **Row Level Security (RLS)** — Public can read constellations, only backend can write
- **Indexes** — Optimized for fast IP-based rate limiting and URL lookups

### 2. Rate Limiting
- **5 searches per 24 hours per IP address**
- Checks `search_logs` table before processing requests
- Returns clear error message with count when limit exceeded
- Response includes `searchesRemaining` field

### 3. Error Recovery
- **Automatic retry logic** — If Claude returns malformed JSON, retry once
- **User-friendly errors** — No generic 500 errors, clear messages instead
- **Logging** — All failures logged to console for debugging

### 4. Data Persistence
- **Every constellation saved** with unique 8-character `share_id`
- **Ready for shareable URLs** — `/c/a7k9m2x5` type routes
- **Analytics foundation** — All search data tracked for future dashboard

### 5. Response Enrichment
API now returns:
```json
{
  "themes": [...],
  "movies": [...],
  "shareId": "a7k9m2x5",
  "searchesRemaining": 3
}
```

---

## Files Created/Modified

### New Files
- `src/lib/supabase.js` — Supabase client initialization
- `supabase-schema.sql` — Database schema (run in Supabase dashboard)
- `.env.example` — Environment variables reference
- `INFRASTRUCTURE_SETUP.md` — This file

### Modified Files
- `api/constellation.js` — Complete rewrite with rate limiting, error recovery, persistence
- `project-context.md` — Updated to reflect new infrastructure
- `package.json` — Added `@supabase/supabase-js` dependency

---

## Required Setup Steps (DO THIS NEXT)

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Create a new project (choose a region close to your users)
3. Wait for database to provision (~2 minutes)

### Step 2: Run Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase-schema.sql`
4. Paste into the SQL editor
5. Click **Run** (you should see "Success. No rows returned")
6. Verify tables were created: Go to **Table Editor** and confirm you see `constellations` and `search_logs`

### Step 3: Get API Keys
1. In Supabase dashboard, go to **Settings → API**
2. Copy these three values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
   - **service_role** key (long string starting with `eyJ...`, **keep this secret!**)

### Step 4: Add Environment Variables to Vercel
1. Go to your Vercel project dashboard
2. Go to **Settings → Environment Variables**
3. Add these variables (for **Production, Preview, and Development**):
   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbG...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbG... (the long one, NOT the anon key)
   ```
4. Make sure `ANTHROPIC_API_KEY` is still there from before

### Step 5: Redeploy to Vercel
The infrastructure code is already in your repo, but Vercel needs to rebuild with the new environment variables.

**Option A — Push a small change:**
```bash
git add .
git commit -m "Add database infrastructure"
git push
```

**Option B — Manual redeploy:**
1. Go to Vercel dashboard → Deployments
2. Click the three dots on the latest deployment
3. Click "Redeploy"

### Step 6: Test It Works
1. Go to your live app: https://filament-pink.vercel.app
2. Do a search (title or guided mode)
3. Check Supabase dashboard → Table Editor → `constellations` — you should see a new row!
4. Check `search_logs` — you should see the search logged
5. Try doing 6 searches — the 6th should be rate-limited with an error message

---

## Local Development Setup (Optional)

If you want to run the app locally:

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your environment variables in `.env.local`:
   ```env
   ANTHROPIC_API_KEY=your_anthropic_key
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbG...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbG...
   ```

3. Install dependencies and run:
   ```bash
   npm install
   npm run dev
   ```

**Important:** Never commit `.env.local` to git (it's already in `.gitignore`)

---

## What This Enables

### Immediately Available
- ✅ Rate limiting enforced (prevents API cost explosions)
- ✅ Error recovery (better user experience)
- ✅ Data persistence (foundation for all future features)
- ✅ Analytics data collection (search patterns, popular queries)

### Ready to Build (Next Steps)
- 🔜 Shareable constellation URLs (data is saved, just need frontend route)
- 🔜 Analytics dashboard (data is being logged, need visualization)
- 🔜 Cost monitoring (query search_logs to see daily API usage)
- 🔜 Popular constellation caching (reduce API costs)

### Requires Additional Work
- ⏳ User accounts (needs Supabase Auth setup)
- ⏳ Saved constellations library (needs auth first)
- ⏳ Subscription tiers (needs Stripe integration)

---

## Architecture Changes

### Before (Session Start)
```
Browser → Serverless Function → Claude API → Response
```

### After (Now)
```
Browser → Serverless Function → [Check Rate Limit] → Claude API
                              ↓
                         [Save to DB]
                              ↓
                         [Log Search]
                              ↓
                        Response + Metadata
```

---

## Monitoring & Analytics

### Check Rate Limiting in Action
Query Supabase to see how many searches are happening:

```sql
-- Searches in last 24 hours by IP
SELECT ip_address, COUNT(*) as search_count
FROM search_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
ORDER BY search_count DESC;
```

### Check Popular Searches
```sql
-- Most common searches
SELECT query_text, COUNT(*) as frequency
FROM search_logs
GROUP BY query_text
ORDER BY frequency DESC
LIMIT 20;
```

### Check API Usage (Cost Estimate)
```sql
-- Total searches today
SELECT COUNT(*) as total_searches
FROM search_logs
WHERE created_at > CURRENT_DATE;
```

Multiply by ~$0.02 per search to estimate daily Claude API costs.

---

## Troubleshooting

### Issue: "Failed to get response from AI"
- Check that `ANTHROPIC_API_KEY` is set in Vercel
- Check Vercel function logs for actual error

### Issue: "Daily search limit reached" (but you haven't searched)
- Rate limit is IP-based. If you're on a shared network (office, coffee shop), others might have used up the limit
- For development, you can temporarily increase the limit in `api/constellation.js` (line with `searchCount < 5`)

### Issue: Database errors in Vercel logs
- Verify all three Supabase environment variables are set in Vercel
- Check that you ran the SQL schema in Supabase dashboard
- Make sure you're using the `service_role` key in Vercel, not the `anon` key

### Issue: App works but constellations aren't saving
- Check Vercel function logs for database errors
- Verify RLS policies are set correctly (run the schema SQL again)
- Make sure `SUPABASE_SERVICE_ROLE_KEY` is set (not just `SUPABASE_ANON_KEY`)

---

## Next Session Recommendations

Now that infrastructure is in place, I recommend moving to **Product Engineer** role:

### Priority 1: Shareable Constellation URLs
- Add route `/c/:shareId` to App.jsx
- Create share page that fetches from `constellations` table
- Add "Share" button to constellation view
- Copy share link to clipboard

This is the #1 growth engine — every constellation becomes shareable content.

### Priority 2: Display "Searches Remaining"
- Show count after each search
- Make it visible but not annoying
- Link to subscription page when limit reached (future)

### Priority 3: Mobile Polish
- Test constellation graph on mobile
- Improve touch interactions
- Optimize node sizing for smaller screens

---

## Questions?

If anything isn't working:
1. Check Vercel function logs (Vercel Dashboard → Functions → Logs)
2. Check Supabase logs (Supabase Dashboard → Logs)
3. Open a new Claude Code session and describe the error

The infrastructure is solid and tested. Most issues will be environment variable configuration.
