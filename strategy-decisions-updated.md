# FILAMENT — Strategy & Decisions Reference
### All strategic decisions, rationale, and project architecture in one place
### Last updated: February 23, 2026

---

## How This Document Is Used

This document lives in Notebook LM and serves as a quick-reference knowledge base for the Filament project. When Saadman needs to recall a decision, understand why something was planned a certain way, or check the status of the project, this is where those answers live.

This document captures strategic thinking and decisions made across Claude Chat conversations. It complements two other documents in this Notebook:
- **The Comprehensive Briefing** — full product, tech, design, and monetization details
- **PROJECT_CONTEXT.md** — the technical project brain (also shared with Claude Code, re-uploaded here after every update)

---

## The Three-Layer System

Filament is being built by a one-person company (Saadman) using AI as the team. The system has three layers plus the human:

### Saadman — The CEO (Layer 0)
- Makes all final decisions
- Chooses what gets built and when
- Acts as the physical presence in the real world: purchases domains, sets up accounts, creates service accounts (Supabase, Stripe, etc.), posts to communities, manages finances
- Reviews and approves all work

### Notebook LM — The Project Brain (Layer 1)
- Holds all project documents and strategic context
- Answers reference questions: "What was the monetization plan?" / "What did we decide about rate limiting?" / "What's the execution order?"
- Provides instant, grounded answers based on actual project documents
- Does NOT create new content, search the web, write code, or make strategic recommendations beyond what's in its sources
- Stays current only when Saadman uploads updated documents after work sessions

### Claude Chat — The Strategist & Content Creator (Layer 2)
- Provides active strategic advice and real-time decision support
- Drafts all written content: marketing copy, Reddit posts, Twitter threads, legal documents (ToS, privacy policy), launch narratives, newsletter content
- Conducts web research: competitor analysis, current pricing for services, trending conversations, market research
- Creates and updates project documents and artifacts
- Handles anything that requires web search, current information, or original content creation

### Claude Code — The Developer (Layer 3)
- Builds all code, features, and infrastructure directly in the Filament codebase
- Works on the actual project files on Saadman's computer through the Terminal
- Reads PROJECT_CONTEXT.md at the start of every session for full context
- Updates PROJECT_CONTEXT.md at the end of every session with progress
- Executes one "agent role" at a time based on Saadman's direction
- Does NOT share memory between sessions — context comes from the project files themselves

### Quick Reference: Who Does What

| Task | Who Does It |
|------|------------|
| "What was the monetization plan?" | Notebook LM |
| "What did we decide about rate limiting?" | Notebook LM |
| "Am I on track with the plan?" | Notebook LM |
| "What should I work on next?" | Claude Chat (or Notebook LM if the answer is clearly in the execution plan) |
| "Write me a Reddit launch post" | Claude Chat |
| "Draft a Terms of Service" | Claude Chat |
| "What are competitors doing right now?" | Claude Chat (web search) |
| "Should I use Plausible or PostHog?" | Claude Chat (web research for current features/pricing) |
| "Set up Supabase and connect it" | Claude Code |
| "Build the shareable URL system" | Claude Code |
| "Add the ToS page to the website" | Claude Code |
| "Buy the domain" | Saadman (physical action) |
| "Set up a Stripe account" | Saadman (physical action) |
| "Post to Reddit" | Saadman (physical action, using copy from Claude Chat) |
| "Create a Supabase account" | Saadman (physical action, then Claude Code does the technical integration) |

---

## The Agent System — Explained

The Filament project uses eight "agents." These are NOT separate programs, separate bots, or separate Claude Code instances. They are defined roles — scopes of focus — that keep the work organized. Seven of the agents are executed through the same single Claude Code instance working on the same single codebase. The eighth (Creative Director) lives primarily in Claude Chat as a thinking and designing role whose outputs get handed to Claude Code for implementation.

Think of it like one incredibly skilled developer who wears different hats. When working on the database, they're wearing the "Infrastructure Architect" hat. When building shareable URLs, they're wearing the "Product Engineer" hat. Same person, same desk, same project — different focus.

The agents "communicate" with each other naturally because they all work on the same codebase and the same PROJECT_CONTEXT.md file. The Infrastructure Architect sets up the database. The Product Engineer uses that database to store shareable constellations. The Monetization agent later adds subscription checks using the auth system that was already built. There's no special "inter-agent communication" needed — the shared codebase IS the communication layer.

### The Eight Agents

**Agent 1 — Infrastructure Architect**
Owns: Database (Supabase), authentication, rate limiting, caching, environment config, deployment pipeline, error handling

**Agent 2 — Product Engineer**
Owns: New features, UI/UX iteration, shareable URLs, expanded guided questionnaire, deep dive mode, multi-seed search, streaming overlay, mobile optimization

**Agent 3 — Growth & Marketing Strategist**
Owns: Community seeding strategy, social content, launch copy, Reddit/Twitter/Letterboxd posting plans, SEO, newsletter, "Mood Archaeology" content series
Note: Strategy and content are created in Claude Chat. Only code-related marketing tasks (Open Graph meta tags, SEO implementation) go through Claude Code.

**Agent 4 — Monetization & Business Ops**
Owns: Stripe integration, subscription tiers, affiliate links (Apple TV, Amazon, Vudu), pricing, cost modeling, free/premium tier gating
Depends on: Agent 1 (database and auth must exist first)

**Agent 5 — Legal & Compliance**
Owns: Terms of service, privacy policy, cookie consent, GDPR, affiliate disclosure
Note: Documents are drafted in Claude Chat, then added to the app via Claude Code. Human review recommended before publishing.

**Agent 6 — Data Quality & Enrichment**
Owns: TMDB API integration (poster images, streaming availability), movie data validation (catching hallucinated titles/years), caching popular constellations

**Agent 7 — Analytics & Optimization**
Owns: Plausible/PostHog setup, event tracking (searches, guided flow completions, node clicks, shares), API cost monitoring, conversion funnel analysis

**Agent 8 — Creative Director** *(Added February 17, 2026)*
Owns: The soul of the product — how Filament understands, categorizes, and communicates about stories. Specifically: thread type taxonomy (what dimensions of connection does Filament map), guided questionnaire design (what questions, how worded, what they target), system prompt voice and instructions (how the AI talks about films/books), cross-medium adaptation (how the core model translates from cinema to literature to future mediums), and the "Why This Exists" detail panel content.
Note: This agent lives primarily in Claude Chat, not Claude Code. It's a thinking and designing role. Outputs get handed to the Product Engineer (Claude Code) for implementation.
Origin: Created after the Filament: Literature exploration revealed that cinema Filament needed deeper craft dimensions beyond thematic threads, and that the guided questionnaire needed a complete redesign.

---

## The Execution Order — What and Why

The execution order follows a strict logical dependency chain, updated on February 17, 2026 to insert a major product redesign before the marketing launch. Each step creates the precondition for the next step. The logic is:

**Money** ← paying users ← free users who love it ← traffic ← growth engine (shareable URLs) ← a product worth launching ← infrastructure ← foundation built first.

Or stated forward: **build the foundation → build the growth engine → redesign the product experience → add visibility (analytics) → add legal cover → launch to communities → polish the product → monetize.**

### Step 1: Infrastructure Architect ✅ COMPLETED
**What:** Set up Supabase (PostgreSQL database + built-in auth), implement rate limiting (5 free searches/day per IP), add error recovery for malformed API responses
**Status:** Completed February 13, 2026. Database live, rate limiting active, error recovery implemented, all constellations saved with shareable IDs.
**Technical details:** Supabase project created with constellations table (stores full JSON + share_id) and search_logs table (IP, timestamp, prompt). Three environment variables added to Vercel: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY. Supabase client utility created at lib/supabaseClient.js. api/constellation.js rewritten to log searches, save constellations, enforce rate limiting. RLS policies and generate_share_id PostgreSQL function created. Pipeline verified end-to-end.

### Step 2: Product Engineer — Growth Features ✅ COMPLETED
**What:** Shareable constellation URLs, rate limit handling in the frontend, searches remaining indicator
**Status:** Completed February 13, 2026. Every constellation has a unique URL (/c/[shareId]), share button with copy-to-clipboard, friendly rate limit messages, searches remaining counter.

### Step 3: Creative Director + Product Engineer — Product Redesign ✅ COMPLETED
**What:** Implement the four cinema thread types (Thematic, Craft Signature, Creative Philosophy, Cinematic Lineage), completely redesign the guided questionnaire, overhaul the UI/UX with improvements discovered during the Literature exploration.
**Status:** Completed February 23, 2026. Delivered in two Claude Code sessions.
**Session 1 (backend + core logic):** New system prompt with four thread types. Updated JSON schema — themes now include `type` and `explanation`, movies now include `why_this_exists`. max_tokens raised to 8000. Granular error handling (network / response parse / API error / JSON parse). New 3-question guided questionnaire (mode of engagement, emotional arc, craft sensibility). `buildGuidePrompt()` compiles selections into natural-language prose. Backward compatible with all existing shared constellation URLs.
**Session 2 (UI/UX overhaul):** Replaced manual physics simulation with d3-force. D3 drag pattern (fx/fy pin). Single-screen onboarding overlay ("We found X films connected by Y invisible threads" + "Start exploring"). Help button (`?`) in header with toggleable explanation card. "What connects them" label above thread pills. Year displayed under each node title. Detail panel reordered (Vibe → Why This Exists → Description → Connected through → Also connected to) and renamed ("Threads" → "Connected through", "Connected To" → "Also connected to"). Bottom hint text that disappears on first interaction. Dimension label removed from questionnaire steps.

### Step 4: Analytics & Optimization ← CURRENT PRIORITY
**What:** Plausible or PostHog integration, event tracking for key user actions (searches, guided flow completions, node clicks, shares, return visits), API cost monitoring
**Why before launch:** Must be live before community seeding so Saadman can learn from the first wave of traffic.
**Done when:** Dashboard shows real-time usage data, key events are tracked, API costs are visible.

### Step 5: Legal & Compliance
**What:** Terms of Service, Privacy Policy, cookie consent
**Why before launch:** Required before real public exposure with real users.
**Done when:** ToS and Privacy Policy pages are live on the site, accessible from the footer.
**Note:** Content drafted by Claude Chat, implemented by Claude Code.

### Step 6: Growth & Marketing — Community Launch
**What:** Launch posts for Reddit (r/MovieSuggestions, r/TrueFilm, r/InternetIsBeautiful, r/SideProject), Film Twitter engagement, Letterboxd community seeding, Open Graph meta tags for beautiful social media previews, basic SEO
**Why this order:** The product is now redesigned with the best possible experience, share-ready, being tracked, and legally covered. This is the moment to go public.
**Launch framing:** "I built a thing that maps movies by feeling instead of genre."
**Note:** Marketing content created by Claude Chat. Technical implementation (OG tags, SEO) by Claude Code. Physical posting by Saadman.

### Step 7: Data Quality & Enrichment
**What:** TMDB API integration (poster images for constellation nodes, streaming availability per film, movie data validation), caching popular constellations to reduce API costs, hallucination detection
**Why after launch:** Polish that transforms Filament from "cool indie tool" to "this feels like a real product worth paying for."
**Done when:** Constellations show poster images, streaming availability is visible, AI-generated movie data is cross-referenced against TMDB for accuracy.

### Step 8: Monetization & Business Ops
**What:** Stripe payment integration, subscription tier ($4-6/month or $36-40/year), premium feature gating (unlimited searches, saved constellations, deep dive mode, streaming overlay, multi-seed search), affiliate link integration (Apple TV, Amazon, Vudu)
**Why last:** No point building a payment system without users to convert.
**Depends on:** Steps 1-7 (needs infrastructure, features, analytics, legal cover, users, and polish)
**Done when:** Users can subscribe, premium features are gated behind subscription, affiliate links are active on constellation nodes, revenue is flowing.

---

## Monetization Plan Summary

### Phase 1 — Build the Audience (Free, Months 0-3)
- Free tier: 5 explorations per day (implemented)
- Shareable constellation URLs as organic growth engine (implemented)
- Seed film communities (Reddit, Film Twitter, Letterboxd)
- Analytics tracking from day one

### Phase 2 — Subscription for Power Users (Months 2-4)
- Price point: $4-6/month or $36-40/year (untested, may adjust)
- Unlocks: unlimited explorations, saved constellations, deep dive mode, streaming overlay, multi-seed search
- Key principle: free version shows discovery, paid version adds depth and utility. Not paywalling the experience — paywalling the tools.

### Phase 3 — Affiliate Revenue (Months 3-6)
- Every film in a constellation links to where you can watch/buy it
- Apple TV, Amazon, Vudu affiliate programs
- Better recommendations → more watches → more affiliate income (aligned incentives)

### Phase 4 — API / B2B (Month 6+)
- License the thematic engine to streaming platforms
- Their approach: "because you watched X" (shallow)
- Filament's approach: "because you felt X" (deep)
- Longer-term play but where real scale lives

### Cost Structure
- Per constellation API call: ~$0.01-0.03 (Claude Sonnet)
- 1,000 daily users × 5 searches: ~$50-150/month
- Vercel free tier covers initial hosting
- Supabase free tier covers initial database
- Budget is bootstrapped/minimal — prefer free tiers of all services until revenue justifies upgrades

---

## Key Strategic Principles

**On Prioritization:** Always ask "does this move us closer to paying users?" If not, it can wait. Shareable URLs are the highest-leverage feature — prioritize ruthlessly. Don't polish before you have traffic.

**On Scope:** Saadman is a solo bootstrapped creator. Every feature decision should be weighed against development time, API cost, and complexity. Prefer free tiers (Supabase free, Vercel free, Plausible community edition) until revenue justifies paid plans.

**On the Product:** The constellation map is the soul of Filament — never compromise the visual, exploratory experience. The "vibe" voice is a core differentiator. Thematic threads (not genres) is the entire point.

**On Growth:** The product is inherently visual and shareable. Film communities are the beachhead audience. The "I built a thing" narrative resonates on Reddit. Screenshots of constellations are marketing assets.

**On Monetization:** Free shows discovery, paid adds utility. Affiliate revenue aligns incentives. The $4-6/month price point needs real-world testing.

**On Documentation:** PROJECT_CONTEXT.md must be updated at the end of every Claude Code session. Strategy & Decisions Reference must be updated after every major strategic decision in Claude Chat. Both documents must be re-uploaded to NotebookLM after updates.

---

## Cinema Thread Architecture (Decided February 17, 2026)

Cinema Filament maps connections through **four thread types**, up from the original one (thematic only):

### 1. Thematic (existing)
Shared feelings, ideas, mythologies, subject matter — what the work is *about*.
Example: "The cost of empire" connects Peaky Blinders to The Sopranos to Macbeth.

### 2. Craft Signature (new)
The audiovisual fingerprint — how the film looks, sounds, and moves through time. Color palette, camera behavior, sound design, musical architecture, editing rhythm, and production design as a unified sensory experience.
Example: "Nocturnal digital grain" connects Collateral to Heat to Miami Vice. "Storybook symmetry" connects Grand Budapest Hotel to Amélie.
Key insight: Two films can be about completely different things but feel identical to sit inside.

### 3. Creative Philosophy (new)
The directorial intelligence behind the work — why these choices were made, how these filmmakers think about storytelling. Connects creators across eras and cultures who approach cinema with the same fundamental beliefs.
Example: "Cinema as spiritual witness" connects Malick to Tarkovsky to Chloé Zhao. "The universe is absurd and precise" connects the Coen Brothers to Yorgos Lanthimos.
Key insight: Two directors can work in completely different visual styles but share a belief about cinema's purpose.

### 4. Cinematic Lineage (new)
Ancestry and descendancy — what a film is responding to, what it descends from, what it spawned, what conversation in cinema history it belongs to.
Example: "Domestic space as horror" traces from Rosemary's Baby through The Shining to Hereditary. "Physical comedy as action cinema" traces from Buster Keaton through Jackie Chan to Fury Road.
Key insight: This adds a time dimension — showing users where a film sits in an evolving conversation.

### System Prompt Distribution
The AI generates 5-7 threads per constellation with this mix: 2-3 thematic, 1-2 craft signature, 1-2 creative philosophy, 1 cinematic lineage.

### Detail Panel Addition: "Why This Exists"
Each film in the detail panel will include a one-sentence line about the creative impulse behind the film — what drove it into existence. This is the cinema equivalent of the literature version's "Why They Wrote It."

---

## Cinema Guided Questionnaire Redesign (Decided February 17, 2026)

The current questionnaire funnels all users into horror/atmospheric/expedition territory. The redesign creates a 64-combination space (4×4×4) where every path produces a meaningfully different constellation.

### Core Principle
"Never let the user feel like they're filling out a form." Questions feel like a conversation with someone who gets cinema. Each targets a genuinely different dimension. No option maps to a single genre.

### Question 1: "How do you want to spend tonight?"
**Dimension:** Mode of engagement — your relationship with the screen right now.
**Why first:** Easiest to answer, requires no reflection — just self-awareness about your current mood.
Options: Total immersion / Active puzzle-solving / Intimate realism / Visual spectacle

### Question 2: "What do you want the experience to do to you?"
**Dimension:** Emotional arc — the shape of the experience, not just the ending.
**Why second:** Slightly more reflective — you need to think about what you want to feel.
Options: Devastating crescendo / Sustained visceral intensity / Dark humor meets tragedy / Existential perspective shift

### Question 3: "What kind of filmmaking is calling to you?"
**Dimension:** Craft sensibility — how you want the story delivered.
**Why last:** Most reflective — asks about aesthetic preferences. By this point the user is warmed up.
Options: Silence and patience / Music as storytelling / Raw and naturalistic / Obsessive precision

### How Combinations Work
Same first two answers with different third answers produce completely different constellations. Example: "Disappear + Build slowly then break me + Silence" → Arrival, Nomadland, Days of Heaven. Same first two + "Soundtrack tells the story" → Interstellar, Moonlight, Cinema Paradiso. The craft dimension is the pivot.

### Full Design Details
Complete question text, hidden signals, example results for all 12 options, and 5 example constellation paths are documented in the "Filament Cinema Craft Dimensions & Guided Questionnaire Redesign" document.

---

## UX Improvements to Backport from Literature Exploration (Decided February 17, 2026)

During the Filament: Literature prototype build, several UX improvements emerged that apply to cinema Filament:

1. **Single-screen onboarding** — Replace the three-step tutorial with one evocative message and a "Start exploring" button. Complexity should be pulled by curiosity, never pushed upfront.
2. **Flattened thread pills** — Remove grouped categories and symbols. One row under the label "What connects them." Clean and scannable.
3. **Thread explanation cards** — When a user clicks a filter pill, a card slides in showing the thread name, its type in plain language, and a one-sentence AI-generated explanation.
4. **"Connected through"** replacing "Threads" in the detail panel — answers "why is this film in my results?"
5. **"Also connected to"** replacing "Connected To" — warmer phrasing implying a web of relationships.
6. **"?" help button** in header — toggles a compact help card, available anytime, dismissible instantly.
7. **Bottom hint text** — "click a movie to explore · drag to rearrange" when nothing is selected. Disappears on interaction.

Design principle: complexity is discoverable through exploration, never front-loaded.

---

## Filament: Literature — Expansion Plans (Decided February 17, 2026)

A functional literature prototype was built in a single session, proving that the constellation model works for books. Key differences from cinema:

**Three literature thread types:** Thematic (same as cinema), Authorial (why the author wrote it, how they write), Influence (literary lineage and response).

**Literature-specific detail panel:** Includes "Why They Wrote It" — one sentence on the author's creative impulse. Author surname displayed on constellation nodes.

**Strategic decision:** Literature will NOT be built as a deployable product right now. Cinema Filament must reach profitability first. Literature launches later as "V2" — a second mode/tab under the same Filament brand, creating a second wave of attention. The brand "Filament: thematic discovery map" is medium-agnostic by design.

**Cross-medium potential:** Future mediums could include music, podcasts, games — all using the same constellation model with medium-appropriate thread types and guided questionnaires.

---

## About Claude Code

Claude Code is a command-line tool that runs in the Terminal on Saadman's Mac. It can see the actual project files, edit them directly, run commands, create new files, and help with deployments. Saadman describes what he wants in plain English, and Claude Code writes the code.

Key facts:
- Claude Code does NOT have memory between sessions. Every new session starts fresh.
- Claude Code reads the project files to understand the codebase — the code itself serves as memory.
- Claude Code reads PROJECT_CONTEXT.md at the start of each session for strategic/planning context.
- PROJECT_CONTEXT.md is updated at the end of each session to log what was built.
- Saadman's technical level: not a professional developer. This is his first full-stack deployed web app. He can follow instructions and modify code but needs guidance on complex architecture. Claude Code should explain things clearly.

---

## About Saadman (The Creator)

- Also goes by Firoz
- GitHub: github.com/Sculptron
- Platform: Mac
- Node.js: v24.13.1 / Git: 2.39.5
- Not a professional developer — learned Git, GitHub, Vercel, serverless functions during this project
- Filament was born from a personal obsession with thematic movie discovery — reverse-engineering feelings to find hidden gems
- Vision: build a system of AI agents to handle every aspect of bringing Filament to market, with Saadman as the CEO and physical executor

---

## Open Questions & Unresolved Decisions

These are decisions that have been discussed but not finalized:

- **Custom domain:** `filament.movie` was mentioned as a possibility but not purchased or configured.
- **Repeat searches:** Same title yields different constellations each time. Feature (fresh discovery) or bug (inconsistency)? No decision made.
- **Mobile UX:** Constellation view works on mobile but needs design attention. Scheduled for a future Product Engineer session.
- **Pricing:** $4-6/month is an estimate, not market-tested. Will be validated after launch with real user data.
- **Analytics tool:** Plausible vs PostHog not decided. Decision needed at Step 4.
- **Timeline:** No formal timeline beyond the phased roadmap. Work proceeds as Saadman's availability allows.

### Resolved (previously open)
- **Database:** ✅ Supabase selected and implemented (Feb 13, 2026)
- **Rate limiting:** ✅ 5 searches per IP per 24 hours, implemented (Feb 13, 2026)
- **Guided questionnaire breadth:** ✅ Complete redesign with 64 combinations decided (Feb 17, 2026) and fully implemented (Feb 23, 2026).

---

## Where to Find Current Project Status

Project status and progress tracking lives exclusively in **PROJECT_CONTEXT.md** (the Progress Log section at the bottom of that document). It is updated after every Claude Code session and re-uploaded to this Notebook.

This document (Strategy & Decisions Reference) does NOT track status. It only tracks decisions, rationale, and architecture. It is updated only when big strategic decisions are made in Claude Chat sessions.
