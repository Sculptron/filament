# FILAMENT — Project Context & Agent System

> **Read this file first at the start of every Claude Code session.**
> This is the living brain of the Filament project. It contains everything you need to understand the product, the architecture, the plan, and the current state of progress.

<!-- DASHBOARD_SNAPSHOT
project_id: filament
project_name: Filament
category: Dev Product
tagline: AI-powered thematic movie discovery via constellation maps
status: Live & Monetized — Warm-Up Week In Progress
phase: Step 6 of 8
progress: 92
last_touched: 2026-03-14
next_milestone: Complete n8n server setup + Phase 1 account credentials → build social media automation (Session A) → launch push to Film Twitter and Reddit
tasks:
  - "CEO: execute warm-up posts 4 and 5 on @watchfilament (copy ready)"
  - "CEO: begin active Film Twitter engagement (Day 4+) — 3-5 interactions/day"
  - "CEO: upgrade contact email to hello@watchfilament.com before launch push"
  - Activate Social Media Strategy Agent — tweet templates, Reddit playbook, launch content arsenal
  - "CEO: apply to Mubi affiliate program (mubi.com/partners)"
  - "CEO: apply to Amazon Associates"
  - Set up n8n server on Raspberry Pi 5 (infrastructure for social media automation)
  - Complete Phase 1 account credential setup to unblock automation build sessions
week_tasks:
  - priority: high
    task: "CEO: post warm-up posts 4 and 5 on @watchfilament"
  - priority: high
    task: "CEO: begin Film Twitter daily engagement rhythm (Day 4+)"
  - priority: med
    task: "CEO: set up domain email hello@watchfilament.com"
  - priority: med
    task: "CEO: apply to Mubi + Amazon Associates affiliate programs"
  - priority: high
    task: "CEO: set up n8n server on Raspberry Pi 5"
  - priority: high
    task: "CEO: complete Phase 1 credential setup (LinkedIn OAuth, Upload-Post.com, Instagram Business, Firecrawl, Rettiwt-API, Google Sheet)"
resources: watchfilament.com · github.com/Sculptron/filament · @watchfilament
parked: false
END_DASHBOARD_SNAPSHOT -->

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
| Serverless API | Vercel Functions | `/api/constellation.js`, `/api/teasers.js`, `/api/checkout.js`, `/api/webhook.js` |
| AI Engine — Constellation | Anthropic Claude API | Model: `claude-sonnet-4-20250514`, max_tokens: 4500 |
| AI Engine — Teasers | Anthropic Claude API | Model: `claude-haiku-4-5-20251001`, max_tokens: 300 |
| Version Control | Git + GitHub | Repository: `Sculptron/filament` |
| Database | Supabase (PostgreSQL) | ✅ Live — `constellations`, `search_logs`, `profiles` tables |
| Auth | Supabase Auth | ✅ Live — Google OAuth + Email/Password |
| Rate Limiting | Hybrid (user + IP) | ✅ 3 searches per user/IP per 24 hours. Pro users: unlimited |
| Payments | Stripe (live mode) | ✅ Live — Monthly $6, Annual $49, Lifetime $79 |
| Domain | Namecheap | watchfilament.com — purchased March 9, 2026, connected to Vercel |
| Analytics | PostHog | ✅ Live — HTML snippet in index.html, VITE_POSTHOG_KEY env var, 5 custom funnel events confirmed firing |

---

## Key Files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Entire frontend — landing, guided flow, constellation view, auth modal, share sheet, cold visitor banner, pro feature visibility, paywall modal |
| `src/supabaseClient.js` | Browser Supabase client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
| `api/constellation.js` | Primary serverless function — proxies to Claude Sonnet, saves to Supabase, enforces hybrid rate limiting, returns `isPro` and `searchesRemaining` |
| `api/teasers.js` | Lightweight Claude Haiku call — returns 5 teaser hints, always returns 200 (silent failure) |
| `api/checkout.js` | Creates Stripe checkout sessions for monthly/annual/lifetime plans |
| `api/webhook.js` | Handles Stripe `checkout.session.completed` — sets `profiles.is_pro = true` via service role key |
| `lib/supabaseClient.js` | Supabase client utility (legacy path — may be consolidated) |
| `schema.sql` | Database schema — all tables, RLS policies, triggers, functions |
| `vercel.json` | Vercel deployment configuration — SPA rewrites only |
| `src/index.css` | Minimal global styles (reset + viewport) |
| `PROJECT_CONTEXT.md` | This file — project brain, read at start of every session |

---

## Environment Variables (Vercel)

| Variable | Used By | Notes |
|----------|---------|-------|
| `VITE_SUPABASE_URL` | Frontend (browser) | Client-side Supabase connection |
| `VITE_SUPABASE_ANON_KEY` | Frontend (browser) | Client-side Supabase connection |
| `SUPABASE_URL` | `api/constellation.js` (server) | Server-side admin client |
| `SUPABASE_SERVICE_ROLE_KEY` | `api/constellation.js`, `api/webhook.js` | Admin client — bypasses RLS |
| `ANTHROPIC_API_KEY` | All API routes | Claude API calls |
| `STRIPE_SECRET_KEY` | `api/checkout.js` | Live mode secret key (`sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | `api/webhook.js` | Webhook signature verification (`whsec_...`) |
| `STRIPE_PRICE_MONTHLY` | `api/checkout.js` | Price ID for $6/mo recurring |
| `STRIPE_PRICE_ANNUAL` | `api/checkout.js` | Price ID for $49/yr recurring |
| `STRIPE_PRICE_LIFETIME` | `api/checkout.js` | Price ID for $79 one-time |
| `VITE_POSTHOG_KEY` | `index.html` (browser) | PostHog project token — write-only, safe for frontend |

**Critical note:** Server-side functions must use `process.env.SUPABASE_URL` (plain name). Client-side code uses `import.meta.env.VITE_SUPABASE_URL`. Do not mix these.

---

## Architecture Flow

```
User's Browser (React SPA)
    ↕ Auth layer (Supabase Auth — Google OAuth + Email/Password)
    ↕ Session token forwarded in Authorization header on every API call

    Two parallel calls fire on search:

    [1] POST /api/teasers (non-blocking, non-critical)
        → Claude Haiku → returns { teasers: string[] } or { teasers: null }
        → Feeds LoadingView progressive teaser display
        → Silent failure — never breaks core flow

    [2] POST /api/constellation (awaited, critical)
        → Extract user from JWT (Authorization header)
        → Check profiles.is_pro → if true: unlimited (searchesRemaining: -1)
        → If not Pro: check rate limit (3/user_id or 3/IP per 24hr)
        → POST https://api.anthropic.com/v1/messages (Sonnet)
        → Parse response (with error recovery for malformed JSON)
        → Generate share_id
        → Save constellation + log search (with user_id if logged in) to Supabase
        → Return clean JSON + share_id + searchesRemaining + isPro to frontend
        → React renders interactive constellation map

    Payment flow:
    [3] POST /api/checkout (on paywall button click)
        → Creates Stripe checkout session with client_reference_id = user.id
        → Returns { url } → frontend redirects to Stripe hosted checkout

    [4] POST /api/webhook (Stripe → Filament, on payment success)
        → Verifies Stripe signature (STRIPE_WEBHOOK_SECRET)
        → On checkout.session.completed:
           → Gets user_id from session.client_reference_id
           → Updates profiles SET is_pro=true, pro_tier=plan, pro_since=now()
        → Returns { received: true } 200 always
```

**Critical webhook note:** The registered webhook URL in Stripe must be `https://www.watchfilament.com/api/webhook` (with www prefix). Using the non-www URL causes a 307 redirect which Stripe does not follow, silently breaking Pro upgrades. This was the root cause of the initial webhook failure — fixed March 11, 2026.

---

## Database Schema

### `constellations` table
Stores generated constellation JSON with shareable IDs.

### `search_logs` table
Logs every search with `ip_address`, `user_id` (nullable), and `created_at`. Used for rate limiting. Index on `(user_id, created_at DESC)` for fast user-based queries.

### `profiles` table
One row per auth user. Created automatically via trigger on `auth.users` insert.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | — | References `auth.users`, cascade delete |
| `is_pro` | boolean | false | Set to true by Stripe webhook on payment |
| `pro_tier` | text | null | 'monthly' \| 'annual' \| 'lifetime' |
| `pro_since` | timestamptz | null | Timestamp of upgrade |
| `created_at` | timestamptz | now() | Auto-set on row creation |

RLS: Users can only read/update their own profile row. Webhook uses service_role key to bypass RLS.

---

## Auth System (Added March 11, 2026)

### Sign-in methods
- **Google OAuth** — one-click, session persists across visits
- **Email + Password** — sign up / sign in via auth modal

### Email confirmation
- Email confirmation is **disabled** in Supabase Auth settings (toggled off March 11, 2026)
- New email/password users can sign in immediately without verification

### Auth UI
- Sign In button in header (landing page + constellation view)
- Auth modal with Google button + email/password tabs — dark glass aesthetic matching paywall
- Avatar replaces Sign In button when logged in
- Sign Out in avatar dropdown
- Pro badge (purple pill) appears next to avatar when `is_pro = true`

### Rate limiting behavior
- **Anonymous users:** 3 searches per IP per 24 hours
- **Logged-in free users:** 3 searches per user_id per 24 hours
- **Pro users:** Unlimited (`searchesRemaining: -1`)

---

## Stripe Integration (Added March 11, 2026)

### Products (live mode)
- **Filament Pro — Monthly:** $6.00 USD recurring monthly
- **Filament Pro — Annual:** $49.00 USD recurring yearly
- **Filament Pro — Lifetime:** $79.00 USD one-time payment

### Checkout flow
1. User hits rate limit → paywall modal appears
2. User clicks a plan button → loading state ("Redirecting...")
3. Frontend POSTs to `/api/checkout` with `{ plan: 'monthly' | 'annual' | 'lifetime' }`
4. Checkout session created with `client_reference_id = user.id`
5. User redirected to Stripe hosted checkout
6. On success → redirected to `https://www.watchfilament.com?success=true`
7. App shows "Payment successful — welcome to Pro!" toast for 7 seconds

### Webhook
- Endpoint: `https://www.watchfilament.com/api/webhook`
- Event: `checkout.session.completed`
- Action: Sets `profiles.is_pro = true`, `pro_tier`, `pro_since` for the paying user
- Signature verified via `STRIPE_WEBHOOK_SECRET`

### Paywall modal behavior
- **Unauthenticated users:** Shows "Sign in to subscribe" banner before plan buttons
- **Logged-in free users:** Shows plan buttons with real pricing
- **Pro users:** Modal does not appear; unlimited searches active

---

## Loading Experience (Rebuilt March 9, 2026)

### Visual Elements
- **Camera aperture iris animation** — 6 SVG blades, 3.5s asymmetric cycle
- **Typography** — Georgia italic. Two-tier hierarchy: status text #777 14.5px; teaser text #bbb 15.5px
- **Background particles** — Amplified density and opacity

### Progressive Teaser System
Two parallel API calls on search. LoadingView manages sentence queue:

**Path A — Teasers arrive:** Status → bridge → 5 real teaser sentences → escalating fallbacks
**Path B — No teasers:** Status → generic phrases → same escalating fallbacks

**Teaser prompt (updated March 10, 2026):**
- Teasers point at OTHER films in the constellation, never the searched title
- 8-15 word limit enforced
- Concrete details (place, person, visual) — no abstract language
- Casual friend tone, not film critic
- Ends with "..." to signal more to discover

---

## Share System

### Canonical Domain
All shareable URLs: `https://watchfilament.com/c/[shareId]`

### Share Sheet
- **Desktop:** Popover below Share button, click-catcher, Escape key closes
- **Mobile:** Bottom sheet with overlay and handle bar
- **Tweet This:** `Typed "[TITLE]" into this film discovery tool. The thematic rabbit hole it came back with — I've never seen anything like it. [url] #FilmTwitter`
- **Copy Link:** Copies canonical URL to clipboard

---

## Cold Visitor CTA Banner

Appears when `isShared === true` (user arrived via `/c/[id]` URL):
- 300ms delay, fade-in animation
- Desktop: full text + "Generate yours →" button routing to `/?ref=shared`
- Mobile: compact single-line version
- Dismiss persists in React session state (`coldVisitorBannerDismissed`)
- `?ref=shared` auto-focuses search input on homepage mount

---

## Pro Feature Visibility

### Moment 1 — "1 Search Remaining" Toast
- Trigger: `searchesRemaining === 1`, 2500ms after constellation renders
- Suppressed if `searchWarningToastDismissed === true` in session state
- Auto-dismisses after 9000ms
- "See what's included →" opens paywall modal with `context='preview'`

### Moment 2 — Paywall Modal
- Trigger: `searchesRemaining === 0` or 429 from API or toast CTA
- Non-dismissible overlay
- Monthly ($6), Annual ($49 — "BEST VALUE"), Lifetime ($79 — "Limited seats remaining")
- Checkout buttons call `/api/checkout` with loading states
- "← Return to constellation" closes modal, constellation preserved in state

---

## The Agent System

| Agent | Role | Status |
|-------|------|--------|
| 1 — Infrastructure Architect | Database, auth, rate limiting, env config | ✅ Complete |
| 2 — Product Engineer | Features, UI/UX, loading, mobile, share | ✅ Complete |
| 3 — Growth & Marketing | Community, social, launch copy, SEO | Pending |
| 4 — Monetization & Business Ops | Stripe, subscriptions, affiliate links | ✅ Complete |
| 5 — Legal & Compliance | ToS, privacy policy, cookie consent | ✅ Complete |
| 6 — Data Quality & Enrichment | TMDB integration, caching | Pending |
| 7 — Analytics & Optimization | Plausible/PostHog, event tracking | ✅ Complete |
| 8 — Creative Director | Thread taxonomy, questionnaire design | ✅ Complete |

---

## Social Media Automation System

A full social media automation architecture has been designed and
locked (March 14, 2026). It sits on top of a weekly content cadence
and reduces CEO social media effort to ~65 minutes per week.

### Weekly Cadence

| Block | Day | Time | What Happens |
|---|---|---|---|
| Review Brief + approve copy | Monday | 15 min | Read AI-generated drafts, approve or edit |
| CapCut Reel edit | Monday | 20 min | Screen record best constellation, export vertical MP4 |
| Tweet + Reel upload + Reddit reply | Wednesday | 20 min | 2-click publish tweet, upload Reel, paste Reddit reply |
| Read Sunday digest + drop theme note | Sunday | 10 min | Review week's performance, note theme for next week |
| **Total** | | **~65 min/week** | |

### Automation Architecture — Tool Stack (~$2/month)

| Tool | Purpose | Cost |
|---|---|---|
| n8n (self-hosted on Raspberry Pi 5) | Full automation backbone — all pipelines and crons | $0 |
| n8n native Reddit node | Reddit subreddit monitoring via official Reddit API | $0 |
| n8n community Twitter scraper node | Film Twitter keyword monitoring (primary) | $0 |
| Firecrawl free tier | Twitter monitoring standby fallback (500 credits/mo) | $0 |
| Browser-use framework | Twitter compose pre-fill — opens browser, pastes, attaches screenshot | $0 |
| LinkedIn API via n8n | Auto-publish LinkedIn posts after Monday approval | $0 |
| Upload-Post.com (free tier) | Simultaneous Instagram Reels + YouTube Shorts publishing | $0 |
| CapCut | Manual 20-min Reel edit (deliberate manual step) | $0 |
| Claude Code + Playwright MCP | Automated screenshots of watchfilament.com (3 crop ratios) | ~$2/mo |
| PostHog (already live) | Social traffic + Pro conversion tracking in Sunday digest | $0 |

### Saturday Night Factory (n8n cron, 11pm, unattended)
Every Saturday night, n8n runs automatically with no CEO input:
1. Queries Supabase for 3 best constellations from past 7 days
   (ranked by thread richness, biased by CEO's Sunday theme note)
2. Playwright MCP screenshots each constellation at 3 crop ratios
   — square (Twitter), portrait 9:16 (Reels), wide (LinkedIn)
   — 9 files total saved to output folder
3. Twitter Film Twitter monitoring — community scraper node scans
   #FilmTwitter, #Letterboxd, "what should I watch", "something
   like [film]" — Claude scores, top 3 reply drafts generated
   (Firecrawl free tier activates automatically if primary fails)
4. Reddit monitoring — native n8n node scans r/TrueFilm, r/movies,
   r/Letterboxd — Claude scores, top 1 reply draft generated
5. Claude API generates all copy in one pass: tweet draft, Reddit
   draft, LinkedIn post, Instagram caption
6. Monday Morning Brief email sent to CEO inbox — all 9 screenshots
   attached, all copy drafts included, all reply candidates with
   direct post links

### Key Decisions (Locked — Do Not Change)
- Reddit posting is permanently human-in-the-loop — never automated
- Twitter posting is 2-click manual publish (Browser-use pre-fills,
  CEO clicks Post) — intentional for account safety on new account
- LinkedIn auto-publishes after Monday approval — no Wednesday action
- CapCut Reel edit stays manual — automation alternative ($27/mo)
  was evaluated and rejected as not worth the cost
- Firecrawl is standby fallback only — not the primary Twitter tool
- Saturday night cron runs fully unattended — CEO does not initiate

### Sunday Feedback Loop
n8n compiles a Sunday digest: tweet engagement stats, Reddit
performance, PostHog social traffic + Pro conversions for the week.
CEO drops a 1-line theme note in a Google Sheet. n8n reads that note
the following Saturday night to bias constellation selection. Loop
closed.

---

## Execution Order & Current Status

| Step | Agent | What Gets Built | Status |
|------|-------|-----------------|--------|
| 1 | Infrastructure Architect | Supabase database, rate limiting, error recovery | ✅ COMPLETED Feb 13 |
| 2 | Product Engineer | Shareable URLs, share button, rate limit UX | ✅ COMPLETED Feb 13 |
| 2.5 | Agent 1 + 2 | Performance fixes, mobile-native experience | ✅ COMPLETED Feb 25 |
| 3 | Creative Director + Product Engineer | v2 port: four thread types, new questionnaire, UI/UX overhaul | ✅ COMPLETED Feb 18 |
| 3.5 | Product Engineer | Progressive teaser loading, iris animation, particle amplification | ✅ COMPLETED Mar 9 |
| 4 | UX/UI Specialist + Product Engineer | Share sheet, cold visitor CTA, Pro feature visibility | ✅ COMPLETED Mar 9 |
| 5a | Infrastructure Architect + Product Engineer | Supabase Auth (Google + Email/Password), profiles table, hybrid rate limiting | ✅ COMPLETED Mar 11 |
| 5b | Monetization | Stripe live, checkout, webhook, rate limit 5→3, Pro badge | ✅ COMPLETED Mar 11 |
| 6a | Social Media Automation Architect | Weekly cadence + automation architecture designed | ✅ COMPLETED Mar 14 |
| 6b | Claude Code (Session A) | n8n Saturday factory: Supabase query, Playwright screenshots, Claude copy, Twitter/Reddit monitoring, Monday Brief email | ⏳ Blocked — n8n server + Phase 1 credentials needed first |
| 6c | Claude Code (Session B) | Distribution layer: Browser-use Twitter compose, LinkedIn API, Upload-Post.com, Sunday digest, Google Sheet feedback loop | ⏳ After Session A |
| 7 | Analytics | Plausible/PostHog, event tracking | ✅ COMPLETED Mar 13 |
| 8 | Legal | ToS, privacy policy | ✅ COMPLETED Mar 13 |
| — | LAUNCH | Film Twitter + Reddit community push | Pending — after Steps 6b + 6c (automation build complete) |

---

## Progress Log

- ✅ **Initial prototype** — Built and deployed to Vercel
- ✅ **Step 1: Infrastructure Architect** — Supabase live, rate limiting, error recovery (Feb 13, 2026)
- ✅ **Step 2: Product Engineer** — Shareable URLs, share button, rate limit UX (Feb 13, 2026)
- ✅ **Creative Director** — Four cinema thread types, guided questionnaire redesign (Feb 17, 2026)
- ✅ **v2 Prototype** — Built and approved (Feb 18, 2026)
- ✅ **Step 2.5: Performance fixes** — Loading screen title, system prompt tuned, max_tokens 4500, response times 44–57s → 35–44s (Feb 25, 2026)
- ✅ **Step 2.5: Mobile-native experience** — Bottom sheet panel, touch-aware nodes, horizontal pill scroll (Feb 25, 2026)
- ✅ **v2 Production port** — Four thread types, new questionnaire, UI/UX overhaul shipped
- ✅ **Step 3.5: Progressive teaser loading** — Dual parallel API calls, iris animation, particle amplification, teaser sentence system (Mar 9, 2026)
- ✅ **Custom domain** — watchfilament.com live (Mar 9, 2026)
- ✅ **Step 4: Share sheet** — Desktop popover + mobile bottom sheet, Tweet This + Copy Link (Mar 9, 2026)
- ✅ **Step 4: Cold visitor CTA banner** — isShared detection, ?ref=shared auto-focus (Mar 9, 2026)
- ✅ **Step 4: Pro feature visibility** — Warning toast + paywall modal with three pricing tiers, placeholder URLs (Mar 9, 2026)
- ✅ **Teaser race condition fixed** — Guided mode mood sentence fix, empty array truthy bug fixed (Mar 9, 2026)
- ✅ **Canonical domain** — All shareable URLs use watchfilament.com (Mar 9, 2026)
- ✅ **Teaser direction fix** — Teasers now point at other films, not the searched title (Mar 10, 2026)
- ✅ **Teaser length/tone fix** — 8-15 word limit, concrete details, casual friend tone (Mar 10, 2026)
- ✅ **Tweet copy redesign** — Experience-first formula, no thread name, no title hashtag (Mar 10, 2026)
- ✅ **Stripe account + products** — Monthly $6, Annual $49, Lifetime $79 created in live mode (Mar 10, 2026)
- ✅ **Google OAuth** — Google Cloud project, OAuth credentials, Supabase provider enabled (Mar 10, 2026)
- ✅ **Step 5a: Supabase Auth** — Google + email/password sign-in, profiles table, hybrid rate limiting, auth modal, avatar/Pro badge in header (Mar 11, 2026)
- ✅ **Constellation API crash fixed** — Server-side client using process.env, conditional init with guard (Mar 11, 2026)
- ✅ **Step 5b: Stripe live** — /api/checkout.js, /api/webhook.js, paywall modal wired to real Stripe, rate limit 5→3, Pro badge, success toast (Mar 11, 2026)
- ✅ **Webhook 307 redirect fixed** — Webhook URL updated to https://www.watchfilament.com/api/webhook (www prefix required to avoid redirect) (Mar 11, 2026)
- ✅ **Full payment flow verified** — Payment → Stripe → Webhook → is_pro=true → unlimited searches + Pro badge confirmed end-to-end (Mar 11, 2026)
- ✅ **Email confirmation fix** — Stale "check your email" message replaced with "Account created! You're now signed in." Modal auto-closes after 1500ms (Mar 13, 2026)
- ✅ **PostHog analytics installed** — HTML snippet in index.html, VITE_POSTHOG_KEY env var in Vercel, 5 custom conversion funnel events instrumented: search_initiated, constellation_rendered, paywall_hit, upgrade_clicked, constellation_shared. User identification on session load. Confirmed firing in PostHog Live Events (Mar 13, 2026)
- ✅ **Legal pages live** — watchfilament.com/terms (Terms of Service) and watchfilament.com/privacy (Privacy Policy) added as React pages via react-router-dom. Footer with copyright + legal links added to main page. Governed by Ontario/Canada law, PIPEDA compliant, GDPR section included. Contact: watchfilament@gmail.com (Mar 13, 2026)
- ✅ **Twitter/X account live** — @watchfilament created, bio, profile picture, banner confirmed live. Pinned tweet: Eternal Sunshine of the Spotless Mind constellation (watchfilament.com/c/t7d509sy). Warm-up posts 1–3 live. Film Twitter engagement account list produced (Mar 13, 2026)
- ✅ **Warm-up posts 4 and 5 posted** — All 5 warm-up posts now live on @watchfilament. Film Twitter engagement rhythm begun (Day 4+). Tier 1 accounts followed (Mar 13–14, 2026)
- ✅ **Social media weekly cadence designed** — Full weekly content and posting cadence locked: Monday creation block (35 min), Wednesday distribution block (20 min), Sunday review block (10 min). Total ~65 min/week (Mar 14, 2026)
- ✅ **Social media automation architecture locked** — 5-phase build plan designed. Tool stack: n8n self-hosted on Raspberry Pi 5, Playwright MCP screenshots, Browser-use Twitter compose pre-fill, LinkedIn API, Upload-Post.com, Firecrawl fallback, Google Sheet feedback loop. Total cost ~$2/month. Architecture approved by CEO after 6 iteration rounds (Mar 14, 2026)

---

## Pre-Launch Checklist (Remaining)

**CEO actions (no agents needed):**
- [ ] Apply to Mubi affiliate program
- [ ] Apply to Amazon Associates
- ✅ @watchfilament account live — handle claimed, profile complete, warm-up in progress
- [ ] Set up UptimeRobot (free, no code — ping watchfilament.com every 5 min)
- [ ] CEO: upgrade contact email to hello@watchfilament.com before launch push

**Next agent sessions (in order):**
- [ ] Social Media Agent — tweet templates, Reddit playbook, launch content
- ✅ Analytics — PostHog installed and confirmed (Mar 13, 2026)
- ✅ Legal — ToS and Privacy Policy live (Mar 13, 2026)

**Do not begin community launch until Social Media Agent session is complete.**

---

## Known Issues / Minor Tech Debt

- **Post-payment Pro status refresh:** After a successful payment and redirect back to the app, the frontend may not immediately reflect Pro status if the session cache is stale. Hard refresh resolves it. A proper fix would re-fetch the user profile on `?success=true` mount. Low priority until user volume justifies it.
- **UptimeRobot cold start prevention** — Free external ping every 5 minutes. No code required. Pending CEO action.

---

## Open Questions / Pending Decisions

- **LTD seat cap** — 100 seats recommended. CEO to confirm before updating paywall copy.
- **Affiliate targets** — Mubi and Amazon Associates applications pending CEO action.

---

## Social Media Automation — Build Phases

Full 31-step build plan to get automation operational. Phases 0
and 1 are CEO actions. Phases 2–5 are Claude Code sessions.

### Phase 0 — Infrastructure
- [ ] Set up n8n server on Raspberry Pi 5
- [ ] Confirm n8n accessible via stable URL for headless cron execution

### Phase 1 — One-Time Account & Credential Setup (CEO actions)
- [ ] Create Google Sheet for Sunday theme feedback loop
      (one tab, one cell — theme bias input for Saturday cron)
- [ ] Register LinkedIn OAuth app for n8n API connection
- [ ] Create Upload-Post.com account, connect Instagram Business
      + YouTube channel
- [ ] Get Instagram Business account approved (Meta review — up to
      2 hours, start this first as it has unpredictable timeline)
- [ ] Get Firecrawl API key (free tier — firecrawl.dev)
- [ ] Install n8n community Twitter scraper node + configure
      Rettiwt-API credentials
- [ ] Confirm PostHog read API key accessible for Sunday digest

### Phase 2 — Session A Build (Claude Code)
- [ ] Build Supabase query — 3 best constellations past 7 days,
      ranked by thread richness, biased by Google Sheet theme note
- [ ] Build Playwright MCP screenshot automation — navigate to
      watchfilament.com, trigger constellation, wait for d3-force
      physics to settle, capture square/portrait/wide crops, save
      9 files to output folder
- [ ] Build Claude API copy generation — tweet draft, Reddit draft,
      LinkedIn post, Instagram caption in one pass per constellation
- [ ] Build Twitter monitoring pipeline — community scraper node
      primary, Firecrawl IF-node fallback, Claude scoring, top 3
      reply drafts
- [ ] Build Reddit monitoring pipeline — native n8n Reddit node,
      r/TrueFilm + r/movies + r/Letterboxd, Claude scoring, top 1
      reply draft
- [ ] Build Monday Morning Brief email — all screenshots, copy
      drafts, reply candidates in single email to CEO inbox
- [ ] Wire Saturday night cron (11pm) to full pipeline
- [ ] Build failure alerting — n8n error node emails CEO if cron
      fails silently

### Phase 3 — Session B Build (Claude Code)
- [ ] Build Browser-use Python environment in n8n Python script node
- [ ] Build Twitter compose pre-fill — Browser-use opens twitter.com
      in CEO's logged-in browser, pastes approved tweet, attaches
      square screenshot, leaves compose window ready for 2-click publish
- [ ] Build LinkedIn auto-publish — fires at optimal Wednesday time
      after Monday approval via official LinkedIn API
- [ ] Build Upload-Post.com integration — sends CapCut MP4 + caption
      for simultaneous Instagram Reels + YouTube Shorts publishing
- [ ] Build Sunday digest — tweet engagement, Reddit performance,
      PostHog social traffic + Pro conversions, sent to CEO inbox
- [ ] Build Google Sheet feedback loop — reads theme note cell on
      Saturday night, injects bias into Supabase constellation query

### Phase 4 — End-to-End Testing
- [ ] Dry run full Saturday cron manually — confirm 9 screenshots,
      all copy drafts, Monday email arrives correctly
- [ ] Test Twitter compose pre-fill — correct content in compose window
- [ ] Test LinkedIn auto-publish with draft post
- [ ] Test Upload-Post.com with test video
- [ ] Test Sunday digest — confirm PostHog data pulls correctly
- [ ] Test Google Sheet feedback loop — write theme note, confirm it
      appears in next Saturday's constellation selection

### Phase 5 — Go Live
- [ ] Flip Saturday cron from manual trigger to scheduled (11pm weekly)
- [ ] Run first live cycle end-to-end

**Critical path:** Instagram Business account approval (Phase 1) has
unpredictable timeline. Start immediately — it blocks Upload-Post.com
integration in Session B.
