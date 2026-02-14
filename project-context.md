# FILAMENT — Project Context & Agent System

> **Read this file first at the start of every Claude Code session.**
> This is the living brain of the Filament project. It contains everything you need to understand the product, the architecture, the plan, and the current state of progress.

---

## What Is Filament?

Filament is an AI-powered thematic movie and TV show discovery tool. Users explore films and shows through an interactive constellation map where movies are nodes connected by colored lines representing shared thematic threads — not genres, but feelings, mythologies, moods, and emotional textures.

**Live URL:** https://filament-pink.vercel.app
**Repository:** https://github.com/Sculptron/filament
**Creator:** Saadman (GitHub: Sculptron)

---

## The Mission

Turn Filament from a working prototype into a profitable product by building a system of AI agents (defined roles executed through Claude Code and Claude chat) that handle every aspect of development, growth, and monetization.

---

## Current Tech Stack

| Layer | Technology | Details |
|-------|-----------|---------|
| Frontend | React (via Vite) | Single-page app, all inline styles, no CSS framework |
| Build Tool | Vite | Standard React + Vite scaffold |
| Hosting | Vercel (free tier) | Auto-deploys on GitHub push |
| Serverless API | Vercel Functions | Node.js serverless function at `/api/constellation` |
| AI Engine | Anthropic Claude API | Model: `claude-sonnet-4-20250514` |
| Version Control | Git + GitHub | Repository: `Sculptron/filament` |
| Database | **Supabase (PostgreSQL)** | ✅ Two tables: `constellations`, `search_logs` |
| Auth | **None yet** | Needs to be set up (Supabase Auth recommended) |
| Analytics | **Basic logging active** | Search logs tracked in database, visualization layer TBD |
| Payments | **None yet** | Needs to be set up (Stripe) |

---

## Key Files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Entire frontend — landing page, guided flow, constellation view, background animation |
| `api/constellation.js` | Serverless function with rate limiting, error recovery, and database persistence |
| `src/lib/supabase.js` | Supabase client initialization (browser + admin clients) |
| `supabase-schema.sql` | Database schema definition (run in Supabase SQL Editor) |
| `vercel.json` | Vercel deployment configuration |
| `src/index.css` | Minimal global styles (reset + viewport) |
| `.env.example` | Environment variables reference |
| `project-context.md` | This file — project brain, read at start of every session |

---

## Architecture Flow

```
User's Browser (React SPA)
    ↓ POST /api/constellation (with prompt + searchType)
Vercel Serverless Function (api/constellation.js)
    ↓ Step 1: Check rate limit (query search_logs for IP)
    ↓ Step 2: POST https://api.anthropic.com/v1/messages
Anthropic Claude API
    ↓ Returns structured JSON (themes + movies)
Serverless Function parses response with retry
    ↓ Step 3: Save constellation to database (with unique share_id)
    ↓ Step 4: Log search to search_logs (IP, query, timestamp)
    ↓ Step 5: Return constellation + shareId + searchesRemaining
React renders interactive constellation map
```

**New Infrastructure Layer:**
- Supabase PostgreSQL database (2 tables)
- Rate limiting: 5 searches per 24 hours per IP
- Error recovery: Retry once if JSON parsing fails
- Persistence: Every constellation saved with shareable ID

---

## Database Schema

### Table: `constellations`
Stores all generated constellation results for sharing and analytics.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `search_query` | TEXT | Original user query (title or guided mode answers) |
| `search_type` | TEXT | Either 'title' or 'guided' |
| `constellation_data` | JSONB | Full constellation JSON (themes + movies) |
| `share_id` | TEXT | Unique 8-char alphanumeric ID for shareable URLs |
| `created_at` | TIMESTAMP | When constellation was generated |
| `view_count` | INTEGER | Number of times shared link was viewed (default 0) |

**Indexes:** `share_id` (for fast URL lookups), `created_at` (for analytics)

### Table: `search_logs`
Tracks every search for rate limiting and analytics.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `session_id` | TEXT | Vercel request ID (if available) |
| `ip_address` | TEXT | User's IP address (for rate limiting) |
| `search_type` | TEXT | Either 'title' or 'guided' |
| `query_text` | TEXT | Search query text |
| `created_at` | TIMESTAMP | When search was performed |
| `constellation_id` | UUID | Foreign key to `constellations` table |

**Indexes:** `ip_address + created_at` (for rate limit queries), `search_type` (for analytics)

### Row Level Security (RLS)
- **Public read** on `constellations` (for shareable URLs)
- **Service role only** for all writes
- **No public access** to `search_logs` (privacy protection)

---

## AI System Prompt (Current)

```
You are a cinematic thematic analyst. You identify deep thematic connections
between films and TV shows — not surface-level genre tags, but the underlying
feelings, mythologies, settings, and emotional textures that connect stories.

When given a movie/show title OR a mood description, return ONLY valid JSON
(no markdown, no backticks, no preamble) in this exact format:
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
      "vibe": "One evocative sentence pitch — the kind of thing a film-obsessed
              friend would say to convince you to watch it."
    }
  ]
}

Rules:
- Generate 4-6 unique thematic threads (not standard genres)
- Return 8-12 movies/shows total
- Each movie should connect to 2-4 themes
- Include a mix of well-known and hidden gems
- The "vibe" should be punchy, evocative, and personal
- Make every theme connect at least 2 movies
- Only return real movies and shows that actually exist with correct years
- theme ids should be lowercase with underscores
```

---

## Features Built ✅

### Core Discovery Experience
- Movie/show title search → AI-generated constellation
- 3-step guided vibe questionnaire → AI-generated constellation
- Interactive force-directed graph with physics simulation
- Node click → detail panel (description, vibe, threads, connections)
- Theme filter pills — click to isolate thematic threads
- Drag-to-rearrange nodes
- Animated geometric dot-and-line background (canvas-based, cursor-reactive)
- Animated loading state with rotating phrases and progress bar
- Responsive layout (works on desktop and mobile)

### Infrastructure & Backend ✅ NEW
- **Supabase PostgreSQL database** with 2 tables (`constellations`, `search_logs`)
- **Rate limiting** — 5 searches per 24 hours per IP address
- **Error recovery** — Automatic retry if AI returns malformed JSON
- **Data persistence** — Every constellation saved with unique `share_id`
- **Analytics logging** — Every search tracked (IP, query, type, timestamp)
- **Secure API key handling** — Service role key for backend, anon key for frontend
- **Response enrichment** — API returns `shareId` and `searchesRemaining` with every constellation

## Features Not Yet Built ❌

- User accounts / authentication (Supabase Auth)
- Shareable constellation URLs (database ready, need frontend route + UI)
- Saved constellations (personal library — requires auth)
- Deep dive mode (click node → expand into its own constellation)
- Streaming availability overlay (TMDB/JustWatch)
- Multi-seed search (input 3-4 films, find thematic center)
- Poster images and movie metadata enrichment
- Analytics dashboard (data is being logged, needs visualization)
- Custom domain
- SEO / server-side rendering / Open Graph meta tags
- Payment processing (Stripe)
- Subscription tier gating
- Affiliate links
- Terms of service / privacy policy
- PWA support
- Expanded guided questionnaire (currently only covers atmospheric/horror/adventure)

---

## The Agent System

Seven defined roles, all executed through one Claude Code instance on one codebase. These are not separate programs — they are scopes of focus that keep work organized.

### Agent 1 — Infrastructure Architect
**Owns:** Database, authentication, rate limiting, caching, environment config, deployment pipeline, error handling
**Tools:** Supabase (recommended), Vercel environment variables

### Agent 2 — Product Engineer
**Owns:** New features, UI/UX iteration, shareable URLs, expanded guided mode, deep dive mode, multi-seed search, streaming overlay, mobile optimization

### Agent 3 — Growth & Marketing Strategist
**Owns:** Community seeding, social content, launch copy, Reddit/Twitter/Letterboxd strategy, SEO, newsletter, "Mood Archaeology" content series
**Note:** Primarily executed through Claude chat (strategy & copy), not Claude Code. Code-related marketing tasks (Open Graph tags, SEO) go through Claude Code.

### Agent 4 — Monetization & Business Ops
**Owns:** Stripe integration, subscription tiers, affiliate links (Apple TV, Amazon, Vudu), pricing, cost modeling, free/premium tier gating
**Depends on:** Agent 1 (database/auth must exist first)

### Agent 5 — Legal & Compliance
**Owns:** Terms of service, privacy policy, cookie consent, GDPR, affiliate disclosure
**Note:** Drafted in Claude chat, added to the app via Claude Code. Human review recommended before publishing.

### Agent 6 — Data Quality & Enrichment
**Owns:** TMDB API integration (posters, streaming availability), movie data validation, caching popular constellations, hallucination detection

### Agent 7 — Analytics & Optimization
**Owns:** Plausible/PostHog setup, event tracking (searches, guided flow, clicks, shares), API cost monitoring, conversion funnel analysis

---

## Execution Order & Rationale

The order follows a logical dependency chain: **build → grow → learn → monetize**

| Step | Agent | What Gets Built | Why This Order |
|------|-------|-----------------|----------------|
| 1 | Infrastructure Architect | Database (Supabase), auth, rate limiting, error recovery | Everything else depends on persistent data and user identity |
| 2 | Product Engineer | Shareable URLs, expanded guided mode, mobile polish | Shareable URLs are the #1 growth engine — every constellation becomes shareable content |
| 3 | Analytics & Optimization | Plausible/PostHog, event tracking | Must be live before community launch so you can learn from traffic |
| 4 | Legal & Compliance | ToS, privacy policy | Required before real public exposure |
| 5 | Growth & Marketing | Reddit launch, Film Twitter, Letterboxd seeding, SEO | Now the product is share-ready, tracked, and legally covered |
| 6 | Data Quality & Enrichment | TMDB integration (posters, streaming links), validation | Polish that makes the product feel worth paying for |
| 7 | Monetization & Business Ops | Stripe, subscriptions, affiliate links, tier gating | Flip the switch once there are users to convert |

**The chain:** Money ← paying users ← free users who love it ← traffic ← growth engine (shareable URLs) ← infrastructure (database/auth/rate limiting) ← foundation built first.

---

## Monetization Plan

### Phase 1 — Build the Audience (Months 0-3)
- Free tier: 3-5 explorations per day
- Shareable constellation URLs (organic growth)
- Seed target communities
- Basic analytics

### Phase 2 — Subscription for Power Users (Months 2-4)
- Price: $4-6/month or $36-40/year
- Unlocks: unlimited explorations, saved constellations, deep dive mode, streaming overlay, multi-seed search
- Principle: free version shows discovery, paid version adds depth and utility

### Phase 3 — Affiliate Revenue (Months 3-6)
- Every film links to where you can watch/buy it
- Apple TV, Amazon, Vudu affiliate programs

### Phase 4 — API / B2B (Month 6+)
- License thematic engine to streaming platforms

### Cost Structure
- Per constellation: ~$0.01-0.03 in Claude API costs
- 1,000 daily users at 3 searches/day: ~$30-90/month
- Vercel free tier covers initial hosting

---

## Branding

- **Name:** Filament (thread of connection + glowing wire inside a light source = cinema)
- **Primary accent:** #C77DFF (purple)
- **Background:** #0a0a0f (near-black with subtle blue)
- **Design language:** Dark, minimal, modern, glassmorphism, animated geometric background
- **Font:** Inter (system fallback)
- **Tone:** Knowledgeable but not pretentious, passionate, slightly poetic
- **Tagline:** "thematic discovery map"
- **Guided mode tagline:** "3 questions. No genres. Just vibes."

### 10-Color Theme Palette
`#4ECDC4` teal · `#C77DFF` purple · `#FF6B6B` coral · `#4D96FF` blue · `#6BCB77` green · `#FFD93D` gold · `#FF8C42` orange · `#E0AAFF` lavender · `#00B4D8` cyan · `#FF477E` pink

---

## Target Communities (Priority Order)

1. r/MovieSuggestions — directly serves their core need
2. r/TrueFilm — discerning audience, values thematic depth
3. Film Twitter — high share velocity
4. Letterboxd communities — film-literate power users
5. r/InternetIsBeautiful, r/SideProject — broader awareness

**Launch framing:** "I built a thing that maps movies by feeling instead of genre."

---

## Creator Context

- **Name:** Saadman (also goes by Firoz)
- **GitHub:** github.com/Sculptron
- **Technical level:** Not a professional developer. Filament is first deployed full-stack web app. Can follow technical instructions and modify code. Needs guidance on complex architecture.
- **Platform:** Mac
- **Node.js:** v24.13.1
- **Git:** 2.39.5
- **Budget:** Bootstrapped / minimal
- **Approach:** Uses Claude Code for all code implementation. Uses Claude chat for strategy, marketing, and non-code decisions.

---

## Progress Log

> Update this section at the end of every Claude Code session.

### Completed
- [x] Initial prototype built and deployed to Vercel
- [x] Core constellation generation working (title search + guided mode)
- [x] Interactive force-directed graph with full UI
- [x] Project context file created (this document)
- [x] **Infrastructure Architect (Session 1)** — Database, rate limiting, error recovery, persistence
  - Supabase client library installed
  - Database schema created (constellations + search_logs tables)
  - Rate limiting implemented (5 searches/24hrs per IP)
  - Error recovery with automatic retry on malformed JSON
  - Constellation persistence with unique share_id
  - Analytics logging for every search
  - Environment variables documented

### In Progress
- [ ] *Nothing currently in progress*

### Up Next
- [ ] **Step 2: Product Engineer** — Build shareable constellation URLs (frontend route + share page)
- [ ] **Step 2: Product Engineer** — Display "searches remaining" indicator in UI
- [ ] **Step 1: Infrastructure Architect** — Set up Supabase Auth for user accounts (continuation)

---

## Environment Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | Vercel + local .env.local | Claude API authentication |
| `SUPABASE_URL` | Vercel + local .env.local | Supabase project URL |
| `SUPABASE_ANON_KEY` | Vercel + local .env.local | Public API key (safe for frontend) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Vercel ONLY** | Admin key (bypasses RLS, never expose to frontend) |
| `VITE_SUPABASE_URL` | Local .env.local only | Frontend Vite env for Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | Local .env.local only | Frontend Vite env for Supabase anon key |

**Note:** See `.env.example` for full reference. Never commit `.env.local` to git.

---

## Open Questions & Unresolved Decisions

- ~~Database choice: Supabase recommended but not confirmed~~ ✅ **RESOLVED: Supabase PostgreSQL active**
- Custom domain: `filament.movie` mentioned as possibility, not purchased
- Guided questionnaire currently skews atmospheric/horror/adventure — needs broadening
- Same search yields different constellations each time — feature or bug? (Non-deterministic by design, but should we cache popular searches?)
- Mobile constellation view needs design attention
- Pricing ($4-6/month) is untested
- No formal timeline beyond phased roadmap
- **NEW:** Should rate limit be configurable by tier once subscriptions are added?
- **NEW:** Should we cache popular constellation queries to reduce API costs?
- **NEW:** What URL structure for shareable constellations? (`/c/:shareId` or `/constellation/:shareId`?)
- **NEW:** Should "searches remaining" be shown after every search, or only when approaching limit?
