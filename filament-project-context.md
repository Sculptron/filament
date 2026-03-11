# FILAMENT — Project Context & Agent System

> **Read this file first at the start of every Claude Code session.**
> This is the living brain of the Filament project. It contains everything you need to understand the product, the architecture, the plan, and the current state of progress.

---

## What Is Filament?

Filament is an AI-powered thematic movie and TV show discovery tool. Users explore films and shows through an interactive constellation map where movies are nodes connected by colored lines representing shared thematic threads — not genres, but feelings, mythologies, moods, and emotional textures.

**Live URL:** https://watchfilament.com *(custom domain — DNS live as of March 9, 2026)*
**Legacy URL:** https://filament-pink.vercel.app *(still works, redirects to watchfilament.com)*
**Repository:** https://github.com/Sculptron/filament
**Creator:** Saadman (GitHub: Sculptron)

---

## The Mission

Turn Filament from a working prototype into a profitable product by building a system of AI agents (defined roles executed through Claude Code and Claude Chat) that handle every aspect of development, growth, and monetization.

---

## Current Tech Stack

| Layer | Technology | Details |
|-------|-----------|---------|
| Frontend | React (via Vite) | Single-page app, all inline styles, no CSS framework |
| Build Tool | Vite | Standard React + Vite scaffold |
| Hosting | Vercel (free tier) | Auto-deploys on GitHub push |
| Serverless API | Vercel Functions | `/api/constellation.js` (primary) + `/api/teasers.js` (parallel, non-blocking) |
| AI Engine — Constellation | Anthropic Claude API | Model: `claude-sonnet-4-20250514`, max_tokens: 4500 |
| AI Engine — Teasers | Anthropic Claude API | Model: `claude-haiku-4-5-20251001`, max_tokens: 300 |
| Version Control | Git + GitHub | Repository: `Sculptron/filament` |
| Database | Supabase (PostgreSQL) | ✅ Live — `constellations` and `search_logs` tables |
| Auth | Supabase (built-in) | Available but not yet used for user accounts |
| Rate Limiting | Custom (IP-based) | ✅ 5 searches per IP per 24 hours (reduction to 3 pending — must happen atomically with Stripe going live) |
| Domain | Namecheap | watchfilament.com — purchased March 9, 2026, connected to Vercel |
| Analytics | **Not yet set up** | Plausible or PostHog — decision pending |
| Payments | **Not yet set up** | Stripe — needed for monetization phase. Paywall UI is live with placeholder checkout URLs. |

---

## Key Files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Entire frontend — landing page, guided flow, constellation view, background animation, loading experience, share sheet, cold visitor banner, pro feature visibility |
| `api/constellation.js` | Primary serverless function — proxies to Claude Sonnet, saves to Supabase, enforces rate limiting |
| `api/teasers.js` | Lightweight Claude Haiku call — returns 5 teaser hints, always returns 200 (silent failure) |
| `lib/supabaseClient.js` | Supabase client utility for database connections |
| `schema.sql` | Database schema — constellations table, search_logs table, RLS policies, generate_share_id function |
| `vercel.json` | Vercel deployment configuration — SPA rewrites only (cron job blocked by Hobby plan) |
| `src/index.css` | Minimal global styles (reset + viewport) |
| `PROJECT_CONTEXT.md` | This file — project brain, read at start of every session |

---

## Architecture Flow

```
User's Browser (React SPA)
    ↕ Two parallel calls fire on search:

    [1] POST /api/teasers (non-blocking, non-critical)
        → Claude Haiku → returns { teasers: string[] } or { teasers: null }
        → Feeds into LoadingView for progressive teaser display
        → Silent failure — never breaks the core flow

    [2] POST /api/constellation (awaited, critical)
        → Check rate limit (5/IP/24hr via search_logs table)
        → POST https://api.anthropic.com/v1/messages (Sonnet)
        → Parse response (with error recovery for malformed JSON)
        → Generate share_id
        → Save constellation + log search to Supabase (blocking)
        → Return clean JSON + share_id to frontend
        → React renders interactive constellation map
```

**Note on Supabase write order:** Non-blocking writes were attempted and reverted — Vercel terminates serverless functions immediately after res.json(), so background saves never completed and shareable URLs broke. Writes remain blocking.

---

## Loading Experience (Rebuilt March 9, 2026)

The loading screen was completely rebuilt from a static spinner into a progressive, cinematic experience.

### Visual Elements
- **Camera aperture iris animation** — 6 SVG blades arranged in a circle, each pivoting individually from its outer edge to open and close (not rotating as a unit). Blades snap open to reveal a purple (#C77DFF) center glow, hold open, then snap shut. 3.5s asymmetric cycle: quick open (0-30%), long hold (30-65%), quick close (65-83%), brief rest (83-100%).
- **Typography** — All loading phrases in Georgia, italic. Two-tier visual hierarchy: status/bridge/fallback text in #777 at 14.5px / 0.75 opacity; teaser text in #bbb at 15.5px / 0.9 opacity.
- **Background particles** — Amplified: skip rate 40%→18% (denser field), node radius 1.0–2.2px→1.4–3.1px, base opacity .12–.30→.22–.50, breathing amplitude .15→.30, hover brightness .5→.7, glow radius 6px→8px, line opacity doubled.

### Progressive Teaser Sentence System
Two parallel API calls fire on search. The LoadingView component manages a sentence queue with two paths:

**Path A — Teasers arrive (~5–8 seconds):**
1. "Finding your constellation..." (0s)
2. "Here's a taste of what's coming..." (bridge, fires when teasers arrive)
3. 5 real teaser sentences from Haiku API (brighter/larger styling)
4. "Almost there..." → "Searching across a century of cinema..." → "Exploring every frame in every archive..." (holds indefinitely)

**Path B — Teasers never arrive:**
1. "Finding your constellation..." (0–6s)
2. Generic cycling phrases (Pulling on thematic threads, Mapping hidden connections, etc.)
3. Same three escalating fallbacks as Path A

**Timing constants:**
- INITIAL_STATUS_HOLD: 6000ms
- TEASER_TRIGGER_DELAY: 1200ms
- SENTENCE_INTERVAL: 4500ms
- FADE_DURATION: 400ms
- IRIS_CYCLE: 3500ms

**Race condition fix (March 9, 2026):** Two bugs were fixed. (1) Guided mode was passing the full `buildGuidePrompt` output to the teasers API instead of a concise mood sentence — teasers API choked, returned null, Path B ran. Fixed: guided mode now extracts user option labels into a clean mood sentence before passing to teasers. (2) An empty array `[]` was truthy, so `if (t) setTeasers([])` fired, set `teasersAppliedRef.current = true`, and permanently blocked Path B. Fixed: guard is now `if (t && t.length)`.

### Preserved Elements
- Searched movie title display ("Mapping the constellation around X")
- Time expectation message ("This can take up to a minute — we're doing the deep work.")
- Progress bar dots: **REMOVED** (March 9, 2026)

---

## Share System (Updated March 9, 2026)

### Canonical Domain
All shareable URLs are built as `https://watchfilament.com/c/[shareId]`. This applies to both the Tweet This and Copy Link actions. The canonical domain is hardcoded — does not vary by Vercel deployment.

### Share Sheet
The Share button no longer copies directly to clipboard. It opens a share sheet:
- **Desktop:** Popover below the Share button (z-index 200), click-catcher behind it, Escape key closes. Purple border tint while open.
- **Mobile:** Bottom sheet with overlay, handle bar, "Share Constellation" title.
- **Tweet This row:** Builds tweet dynamically: `just mapped "[title]" on Filament and got a constellation connected by "[thread name]" — this thing is uncanny [url] #FilmTwitter`. Optional title hashtag appended if character budget allows. Opens `twitter.com/intent/tweet` in new tab.
- **Copy Link row:** Copies `watchfilament.com/c/[shareId]` to clipboard. Confirmed state: "✓ Copied!" in #C77DFF for 2000ms then reverts.

---

## Cold Visitor CTA Banner (Added March 9, 2026)

When a user arrives via a shared `/c/[id]` URL (`isShared === true`, derived from `api/shared.js`), a dismissible banner appears at the top of the constellation view.

- **Appears:** 300ms after constellation loads, with fade-in animation
- **Desktop:** Full text — "Someone mapped the films connected to [title]. Explore their constellation — or generate your own." + "Generate yours →" button (purple, routes to `/?ref=shared`) + × close button
- **Mobile:** Compact single-line — "Films connected to [title] — make your own." + "Generate →" + ×
- **Dismiss:** Collapses with max-height animation. `coldVisitorBannerDismissed` flag stored in React session state — persists across in-session navigations, resets on page reload.
- **`?ref=shared` on homepage:** Homepage detects this param on mount and programmatically focuses the search input (`inputRef.current?.focus()`).

---

## Pro Feature Visibility (Added March 9, 2026)

Two sequential moments that surface the Pro offering. Driven by `searchesRemaining` returned from `api/constellation.js`.

### Moment 1 — "1 Search Remaining" Toast
- **Trigger:** `searchesRemaining === 1`, fires 2500ms after constellation renders
- **Suppressed if:** `searchWarningToastDismissed === true` in session state
- **Content:** Purple dot + "1 free search remaining." + "Pro unlocks unlimited." + "See what's included →" CTA + × close
- **Auto-dismisses** after 9000ms
- **"See what's included →"** closes toast and opens paywall modal with `context='preview'`
- **×** sets `searchWarningToastDismissed = true` (does not reshow in session)

### Moment 2 — Paywall Modal
- **Trigger:** Search attempted when `searchesRemaining === 0`, OR 429 from API, OR "See what's included →" from toast (`context='preview'`)
- **Non-dismissible overlay** (clicking outside does nothing)
- **context='blocked':** "You've used your 3 free searches for today. Come back tomorrow — or join Pro for unlimited exploration."
- **context='preview':** "Pro members search without limits. Here's everything that's included."
- **Note on copy:** Modal says "3 free searches" — this is forward-looking copy for when the rate limit is reduced to 3 at Stripe launch. Server currently enforces 5.
- **Pricing cards:** Monthly ($6/mo), Annual ($49/yr — "BEST VALUE" badge), Lifetime ($79 one-time — "Limited seats remaining")
- **Checkout URLs:** `/checkout/monthly`, `/checkout/annual`, `/checkout/lifetime` — placeholders, all 404 until Stripe is integrated
- **"← Return to constellation"** closes modal; constellation remains in state
- **Mobile:** Bottom sheet layout, Annual first, Monthly second, Lifetime third

---

## Session State Flags (Global, React Context / Module-Level)

Two flags persist across in-session component navigations (not localStorage — reset on page reload):
- `coldVisitorBannerDismissed` — prevents cold visitor banner from reappearing after dismiss
- `searchWarningToastDismissed` — prevents "1 search remaining" toast from reappearing after × close

---

## The Agent System

Eight defined roles. Seven executed through one Claude Code instance on one codebase. The eighth (Creative Director) lives primarily in Claude Chat.

### Agent 1 — Infrastructure Architect
**Owns:** Database, authentication, rate limiting, caching, environment config, deployment pipeline, error handling
**Status:** Core infrastructure complete. Cold start prevention blocked by Vercel Hobby plan — UptimeRobot setup pending.

### Agent 2 — Product Engineer
**Owns:** New features, UI/UX iteration, shareable URLs, loading experience, guided mode, mobile optimization
**Status:** Complete through March 9, 2026. All pre-launch UX features shipped.

### Agent 3 — Growth & Marketing Strategist
**Owns:** Community seeding, social content, launch copy, Reddit/Twitter/Letterboxd strategy, SEO, newsletter
**Note:** Primarily executed through Claude Chat. Code-related tasks (OG tags, SEO) go through Claude Code.

### Agent 4 — Monetization & Business Ops
**Owns:** Stripe integration, subscription tiers, affiliate links, pricing, tier gating
**Depends on:** Agent 1 (database/auth must exist first)

### Agent 5 — Legal & Compliance
**Owns:** Terms of service, privacy policy, cookie consent, GDPR, affiliate disclosure
**Note:** Drafted in Claude Chat, added to app via Claude Code.

### Agent 6 — Data Quality & Enrichment
**Owns:** TMDB API integration, movie data validation, caching popular constellations

### Agent 7 — Analytics & Optimization
**Owns:** Plausible/PostHog setup, event tracking, API cost monitoring, conversion funnel analysis

### Agent 8 — Creative Director *(Added February 17, 2026)*
**Owns:** Thread type taxonomy, guided questionnaire design, system prompt voice, cross-medium adaptation
**Note:** Lives in Claude Chat. Outputs handed to Product Engineer for implementation.
**Status:** Cinema thread architecture and questionnaire redesign complete. v2 prototype built and reviewed.

---

## Execution Order & Current Status

| Step | Agent | What Gets Built | Status |
|------|-------|-----------------|--------|
| 1 | Infrastructure Architect | Supabase database, rate limiting, error recovery | ✅ COMPLETED Feb 13 |
| 2 | Product Engineer | Shareable URLs, share button, rate limit UX | ✅ COMPLETED Feb 13 |
| 2.5 | Agent 1 + 2 | Performance fixes, mobile-native experience | ✅ COMPLETED Feb 25 |
| 3 | Creative Director + Product Engineer | v2 port: four thread types, new questionnaire, UI/UX overhaul | ✅ COMPLETED (date TBC) |
| 3.5 | Product Engineer | Progressive teaser loading, iris animation, particle amplification | ✅ COMPLETED Mar 9 |
| 4 | UX/UI Specialist + Product Engineer | Share sheet, cold visitor CTA, Pro feature visibility | ✅ COMPLETED Mar 9 |
| **5** | **Monetization (Stripe)** | **Stripe live, rate limit 5→3, placeholder URLs replaced** | **← NEXT SESSION** |
| 6 | Social Media Agent | Tweet templates, Reddit playbook, launch content | Pending |
| 7 | Analytics | Plausible/PostHog, event tracking | Pending |
| 8 | Legal | ToS, privacy policy | Pending |
| — | LAUNCH | Film Twitter + Reddit community push | Pending — after Steps 5–6 |

---

## Progress Log

- ✅ **Initial prototype** — Built and deployed to Vercel
- ✅ **Step 1: Infrastructure Architect** — Supabase live, rate limiting (5/IP/24hr), error recovery (Feb 13, 2026)
- ✅ **Step 2: Product Engineer** — Shareable URLs, share button, rate limit UX (Feb 13, 2026)
- ✅ **Creative Director** — Four cinema thread types, guided questionnaire redesign (64 combinations) (Feb 17, 2026)
- ✅ **v2 Prototype** — Built and approved (Feb 18, 2026)
- ✅ **Step 2.5: Performance fixes** — Loading screen title + time expectation, system prompt tuned to 8 movies, max_tokens 4500, conciseness rules, token logging, response times 44–57s → 35–44s (Feb 25, 2026)
- ✅ **Step 2.5: Mobile-native experience** — Bottom sheet panel, touch-aware nodes, horizontal pill scroll, responsive typography (Feb 25, 2026)
- ✅ **v2 Production port** — Four thread types, new questionnaire, UI/UX overhaul shipped to production
- ✅ **Step 3.5: Progressive teaser loading system** — Dual parallel API calls (Sonnet + Haiku), sentence queue with two paths, camera aperture iris animation, background particle amplification, Georgia italic typography, progress dots removed (Mar 9, 2026)
- ✅ **Custom domain** — watchfilament.com purchased (Namecheap, Mar 9, 2026), DNS configured, connected to Vercel production
- ✅ **Step 4: Share sheet redesign** — Desktop popover + mobile bottom sheet. Tweet This (dynamic tweet construction with title, thread name, hashtag) + Copy Link (copied/failed states). Share button purple tint while open. (Mar 9, 2026)
- ✅ **Step 4: Cold visitor CTA banner** — Appears on `/c/[id]` shared URLs via `isShared` flag. Desktop full text + CTA, mobile compact. `?ref=shared` auto-focuses search input on homepage. Dismiss persists in session state. (Mar 9, 2026)
- ✅ **Step 4: Pro feature visibility** — "1 search remaining" toast (2500ms delay, 9s auto-dismiss, session suppression). Paywall modal with Monthly ($6), Annual ($49), Lifetime ($79) pricing. Placeholder checkout URLs. Non-dismissible overlay, constellation preserved in state on close. (Mar 9, 2026)
- ✅ **Teaser loading race condition fixed** — Two bugs: guided mode passed full prompt to teasers API (fixed to concise mood sentence); empty array `[]` treated as truthy poisoned `teasersAppliedRef` (fixed with `t && t.length` guard). (Mar 9, 2026)
- ✅ **Canonical domain** — All shareable URLs (Tweet This + Copy Link) now hardcoded to `watchfilament.com/c/[id]`. (Mar 9, 2026)
- ✅ **Teaser prompt direction fix** — Teasers now point outward at other films in the constellation, not back at the searched title. System prompt updated with explicit rule: "Teasers must be about OTHER films, never the one the user searched for." User prompt updated to pass searched title explicitly as context for what NOT to describe. (Mar 10, 2026)
- ✅ **Teaser length and tone fix** — System prompt now enforces 8-15 word limit per teaser, demands concrete details (place, person, visual), bans abstract/flowery language, and frames tone as "like a friend giving you a quick exciting hint." Teasers now render as a single line on mobile within the 4.5s display window. (Mar 10, 2026)
- ✅ **Tweet copy redesign** — Tweet formula replaced entirely. Old formula exposed internal product language (thread names, "mapped", "constellation") that meant nothing to cold readers. New formula: `Typed "[TITLE]" into this film discovery tool. The thematic rabbit hole it came back with — I've never seen anything like it. [url] #FilmTwitter`. Title hashtag logic removed. #FilmTwitter is the only hashtag. (Mar 10, 2026)
- ✅ **Supabase Auth** — Google OAuth + email/password sign-in. Session persisted via localStorage. Hybrid rate limiting: user_id-based for logged-in users, IP-based for anonymous. Pro users (profiles.is_pro = true) get searchesRemaining = -1 (unlimited). AuthModal + AuthButton components added to landing and constellation header. (Mar 11, 2026)
- ✅ **Fixed constellation API crash** — `createClient` at module init threw "supabaseUrl is required" when SUPABASE_URL env var was missing at cold start. Fixed with defensive conditional init + early-exit guard in handler returning clean 500 instead of crash. Added console.log for request debug. SUPABASE_URL and SUPABASE_ANON_KEY must be set in Vercel env vars. (Mar 11, 2026)

---

## Pre-Launch Checklist (Remaining)

**CEO actions (no agents needed):**
- [ ] Apply to Mubi affiliate program
- [ ] Apply to Amazon Associates
- [ ] Confirm Twitter/X account exists + claim @watchfilament handle
- [ ] Create Stripe account (required before Stripe session)
- [ ] Set up UptimeRobot (free, no code — ping watchfilament.com every 5 min for cold start prevention)

**Next agent sessions (in order):**
- [ ] Stripe session (Claude Code) — Stripe live, rate limit 5→3, placeholder checkout URLs replaced
- [ ] Social Media Agent — tweet templates, Reddit playbook
- [ ] Analytics — Plausible or PostHog (decision needed before this session)
- [ ] Legal — ToS, privacy policy

**Do not begin community launch until Stripe session and Social Media Agent are complete.**

---

## Known Mismatches To Fix At Stripe Session

**Rate limit copy vs server enforcement mismatch:**
The Pro paywall modal copy says "You've used your 3 free searches for today" but the server currently enforces 5 searches. This is intentional — the copy is forward-looking. At the start of the Stripe integration session, Claude Code must simultaneously: (1) reduce server-side rate limit from 5 to 3 in `api/constellation.js`, and (2) confirm Stripe checkout URLs are live and replace the three placeholder URLs (`/checkout/monthly`, `/checkout/annual`, `/checkout/lifetime`). Do not change the server limit without Stripe being live.

---

## Open Questions / Pending Decisions

- **UptimeRobot cold start prevention** — Set up free external ping every 5 minutes to keep serverless function warm. No code required. Pending CEO action.
- **Analytics tool** — Plausible vs PostHog not yet decided. Decision needed before analytics session.
- **LTD seat cap** — 100 seats recommended by Monetization Strategist. CEO to confirm before Stripe session.
- **Stripe account** — Needs to be created by CEO before Claude Code can implement paywall.
