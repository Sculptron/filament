Filament — Portfolio & Skills Intelligence Brief
Extracting career and portfolio value from the Filament project
Prepared: February 20, 2026
--------------------------------------------------------------------------------
1. What I Actually Built
The Elevator Pitch (Non-Technical)
I built and deployed a live AI-powered web application that helps people discover movies and TV shows through feelings and emotional connections rather than traditional genres. Instead of browsing categories like "action" or "horror," users either search for a film they love or answer three intuitive questions about their mood — and the app generates an interactive visual map showing 8-12 connected films with the invisible threads that link them. The tool is live at watchfilament.com, handles real users, enforces a 3-search-per-day limit using a hybrid IP + user account system, and produces shareable links that anyone can open. The product is fully monetized with Stripe payments (monthly $6, annual $49, lifetime $79), Supabase authentication (Google OAuth and email/password), and has confirmed paying customers. Everything from the AI engine to the database to the payment infrastructure was built and configured by me.
Core Components I Built or Configured
Full-stack web application (React + Vercel)
Single-page React app with multiple views: landing page, guided questionnaire flow, loading animation, and interactive constellation map
Vercel serverless function acting as a secure API proxy between the frontend and the Anthropic Claude API
Automated deployment pipeline: push code to GitHub → Vercel auto-builds and deploys to production
AI-powered recommendation engine
Custom system prompt engineering that instructs Claude to analyze films across four dimensions (thematic connections, craft signatures, creative philosophies, cinematic lineage) and return structured JSON
Two input pathways: direct title search and a 3-question guided flow that compiles user selections into optimized natural-language prompts
Structured output parsing with error recovery for malformed AI responses
Database and backend infrastructure (Supabase)
PostgreSQL database with two tables: constellation storage (full JSON with unique share IDs) and search logging (IP, timestamp, prompt)
Custom PostgreSQL function for generating unique short IDs
Row Level Security policies for data protection
IP-based rate limiting system (5 searches per user per 24 hours) enforced server-side
Interactive data visualization
Force-directed graph (d3-force physics simulation) where movie nodes attract, repel, and cluster based on shared thematic connections
Drag interaction, click-to-select, theme filtering, hover states, and animated transitions
Canvas-based animated background with cursor-reactive particle system
Shareable content system
Every AI-generated constellation is saved to the database with a unique URL
Recipients can view shared constellations without triggering an API call or counting against rate limits
Copy-to-clipboard sharing functionality

Current Tech Stack

| Component | Detail |
|-----------|--------|
| AI Engine (Constellation) | `claude-sonnet-4-20250514` (max_tokens: 4500) |
| AI Engine (Teasers) | `claude-haiku-4-5-20251001` (lightweight parallel call, max_tokens: 300) |
| Auth | Supabase Auth — Google OAuth + Email/Password — live |
| Payments | Stripe live mode — Monthly $6 / Annual $49 / Lifetime $79 — confirmed paying customers |
| Rate Limiting | Hybrid (user_id + IP) — 3 searches per 24 hours for free users; unlimited for Pro users |
| Analytics | PostHog — 5 custom funnel events: search_initiated, constellation_rendered, paywall_hit, upgrade_clicked, constellation_shared |
| Domain | watchfilament.com (Namecheap, connected to Vercel, live March 9 2026) |

--------------------------------------------------------------------------------
2. AI & LLM Application
LLMs and AI Tools Used
Tool
Role in the Project
Anthropic Claude API (Sonnet)
Core recommendation engine — generates thematic analysis, film connections, descriptions, and "vibe" pitches via structured JSON output
Claude Chat (Claude Opus)
Strategic advisor, prompt engineer, content creator, document drafter, prototype designer, and product reviewer
Claude Code
Hands-on developer — wrote all production code, configured infrastructure, handled deployment directly in the terminal
NotebookLM
Knowledge base / project brain — stores all project documents for instant reference and context retrieval
Prompt Engineering — Specific Outcomes
Production system prompt (powering the live app):
Engineered a system prompt that instructs Claude to return only valid JSON in a precise schema — no markdown, no preamble, no backticks
Defined four distinct "thread types" with concrete examples so the AI generates connections across multiple dimensions, not just surface-level genre tags
Included a distribution rule (2-3 thematic, 1-2 craft, 1-2 philosophy, 1 lineage) to prevent any single dimension from dominating results
Added quality constraints: "poetic and specific, never generic genre labels" for thread names; "punchy, personal, evocative — NOT a plot summary" for vibe lines; "only return REAL movies/shows with CORRECT years" to reduce hallucination
Iterated from a v1 prompt (single thread type, 4000 token limit) to a v2 prompt (four thread types, richer output fields, 8000 token limit) based on strategic analysis of what was missing
Guided questionnaire prompt compilation:
Designed a system where user selections (option indices) are compiled into rich natural-language prose descriptions before being sent to the API
This is a deliberate prompt engineering choice — raw tag dumps ("folklore, mythology, ancient evil") produce weaker results than semantic descriptions ("films that demand total immersion — worldbuilding so complete you forget yourself") because they give the LLM more context about what each dimension means
The compilation function maps selection indices to pre-written prose descriptions across three dimensions, producing a multi-paragraph prompt that reads like a human request
Structured output handling:
The system prompt enforces JSON-only output, but the parsing layer includes fallback cleaning (stripping markdown fences) and granular error handling at each stage (network error, HTTP error, response shape validation, JSON parse failure) with descriptive error messages
AI Agent Workflows
I designed and operate an eight-agent framework where each "agent" is a defined role with a specific scope of responsibility. Seven agents are executed through Claude Code (the same tool, wearing different hats), and one (Creative Director) operates through Claude Chat:
Infrastructure Architect — database, auth, rate limiting, deployment pipeline
Product Engineer — features, UI/UX, frontend development
Growth & Marketing Strategist — community strategy, launch copy, SEO
Monetization & Business Ops — payment integration, subscription tiers, affiliate revenue
Legal & Compliance — terms of service, privacy policy
Data Quality & Enrichment — movie database integration, hallucination detection
Analytics & Optimization — usage tracking, cost monitoring
Creative Director — product soul: thread taxonomy, questionnaire design, system prompt voice
These agents share context through a living project document (PROJECT_CONTEXT.md) that gets read at the start of every session and updated at the end. This solves the "AI has no memory between sessions" problem — the document IS the memory.
The workflow across the full system: Strategic decisions happen in Claude Chat → get documented in reference files → get uploaded to NotebookLM for retrieval → get read by Claude Code for implementation → Claude Code updates the project document → cycle continues.
Claude Code Usage
Claude Code is my primary development tool. I use it for all code implementation:
Writing React components, serverless functions, and database queries
Configuring Supabase tables, RLS policies, and PostgreSQL functions
Setting up Vercel deployment configuration and environment variables
Running git commands (add, commit, push) to trigger deployments
Debugging issues in real-time by reading error logs and modifying code
I am not a professional developer. Claude Code is what makes it possible for me to build production-quality full-stack applications. My role is directing what gets built, making architectural decisions, testing the output, and managing the project — Claude Code handles the implementation.
--------------------------------------------------------------------------------
3. Automation & Workflow
What Automations Exist
Automated deployment pipeline:
Git push to GitHub → Vercel detects the change → auto-builds the React app → deploys to production
Zero manual deployment steps after the initial configuration
Environment variables (API keys, database credentials) managed securely through Vercel's dashboard
AI-powered content generation pipeline:
User input (title or questionnaire selections) → prompt compilation → API call to Claude → structured JSON response → parsed and validated → saved to database with unique share ID → rendered as interactive visualization
This entire pipeline runs automatically on every user search with no human intervention
Rate limiting automation:
Every search is logged to the database with IP and timestamp
Before each new search, the serverless function queries the database for that IP's searches in the last 24 hours
If the count exceeds 5, the request is rejected with a user-friendly message
No manual monitoring required — the system self-enforces
Shareable URL system:
Every constellation is automatically assigned a unique short ID via a PostgreSQL function
The URL is constructed and made available to the user via a share button
When someone opens a shared link, the constellation is fetched from the database — no new API call, no rate limit impact
Complexity Level
These are multi-step conditional workflows with real error handling, not simple triggers. The constellation generation pipeline alone involves: input validation → rate limit check (database query with conditional rejection) → API call with timeout handling → response validation (HTTP status, response shape, JSON parsing) → database write (constellation storage + search logging) → response formatting → frontend rendering with physics simulation. Each step has its own failure mode and recovery path.
Deployment Status
This is fully deployed to a real production environment, not a prototype:
Live URL: https://watchfilament.com
Real users can access it right now
Real API calls to Anthropic's Claude API
Real PostgreSQL database on Supabase storing real data
Real rate limiting enforcing real usage caps
Real shareable URLs that work for anyone with the link
The product has progressed beyond prototype to a fully monetized SaaS with paying customers — demonstrating end-to-end product ownership from concept through payment infrastructure and growth strategy.
--------------------------------------------------------------------------------
4. Problem-Solving With AI
Hard Problem: Making AI Output Feel Like Discovery, Not a List
The core challenge: every AI chatbot can recommend movies. ChatGPT, Gemini, Claude — they all produce flat bullet-point lists that feel robotic. The problem isn't the recommendations themselves; it's the presentation and the depth.
How I solved it with AI:
Engineered the system prompt to force structured JSON output with specific fields (themes with types and explanations, movies with vibes and creative impulses) rather than free-text responses
Designed the four-thread-type taxonomy (thematic, craft, philosophy, lineage) so the AI analyzes connections across multiple dimensions simultaneously — something no existing recommendation tool does
Created the "vibe" field with explicit instructions ("like a film-obsessed friend convincing you to watch it at 2 AM") to produce writing that feels human and personal, not encyclopedic
Added the "why_this_exists" field to surface the creative impulse behind each film — a layer of insight that transforms a recommendation into an education
The result: the same underlying AI technology (Claude) produces output that feels fundamentally different from a chatbot conversation because the prompt engineering and output structure create a curated experience.
Chaining Multiple AI Tools Together
The Filament workflow chains four AI tools in sequence:
Claude Chat (strategy) → decides what the product should do, designs the system prompt, designs the questionnaire, reviews prototypes
Claude Chat (prototyping) → builds functional React prototypes as artifacts for testing and iteration before touching production code
Claude Code (implementation) → takes the approved prototype and ports it to the production codebase, handling all the infrastructure (database, serverless functions, deployment)
Claude API (runtime) → powers the live product, generating unique constellations for every user search
Each tool has a defined role. Strategic thinking happens in Claude Chat. Code execution happens in Claude Code. Runtime intelligence happens through the API. Context flows between them through documented project files.
Research and Analysis Using AI
Competitor analysis: Used Claude Chat to research and compare existing discovery tools (Letterboxd, JustWatch, Netflix algorithms, ChatGPT recommendations) and identify the specific gap Filament fills
Pricing research: Used Claude Chat with web search to investigate subscription pricing for comparable consumer tools, arriving at the $4-6/month price point
Prompt engineering iteration: Used Claude Chat to analyze why the v1 system prompt produced horror-skewed results and design the v2 prompt that produces genre-agnostic results across all of cinema
Cross-medium analysis: Used Claude Chat to explore whether the Filament model could work for literature, identifying that cinema's creative signature is distributed across multiple roles (direction, cinematography, score) while literature's emanates from a single author — leading to different thread type taxonomies for each medium
--------------------------------------------------------------------------------
5. What This Demonstrates to a Client or Employer
Specific Freelance Service Offerings This Project Credibly Supports
AI Application Development
Building custom AI-powered web applications that use LLM APIs (Anthropic, OpenAI) to deliver structured, domain-specific outputs
Designing production system prompts that reliably generate structured data (JSON, specific schemas) from natural language inputs
Implementing AI-powered features end-to-end: from prompt engineering to API integration to frontend rendering
AI Workflow Design & Automation
Designing multi-agent AI workflows where different AI tools handle different functions (strategy, implementation, runtime)
Creating documentation systems that maintain context across AI sessions (solving the "AI has no memory" problem)
Building AI-powered content pipelines that run autonomously in production
Prompt Engineering (Advanced)
System prompt design for structured output (JSON schemas, specific field requirements, quality constraints)
Multi-dimensional prompt engineering (forcing AI to analyze inputs across multiple independent dimensions simultaneously)
Prompt optimization through iteration (v1 → v2 evolution with measurable quality improvements)
Natural-language prompt compilation (converting user selections into semantically rich prompts)
No-Code / Low-Code AI Product Building
Taking a product idea from concept to deployed, functioning web application using AI-assisted development
Configuring cloud infrastructure (Vercel, Supabase) for AI-powered applications
Building and deploying serverless API endpoints that securely proxy LLM calls
AI Strategy & Consulting
Designing AI agent frameworks for solo creators and small teams
Creating documentation and workflow systems for AI-augmented project management
Identifying where AI adds genuine value in a product (not just "add AI to everything")
Job Titles / Roles This Makes Me More Competitive For
AI Solutions Developer / AI Application Builder — building real products powered by LLMs
Prompt Engineer — designing system prompts that produce reliable, structured, high-quality outputs
AI Automation Specialist — designing workflows that chain AI tools together for business outcomes
AI Product Manager — defining what AI should do in a product, designing the user experience around AI capabilities
No-Code/Low-Code AI Developer — using AI-assisted tools to build and deploy real applications
AI Consultant (Freelance) — helping businesses identify AI opportunities and implement solutions
Technical Project Manager (AI Projects) — managing multi-tool AI workflows with documentation systems
Strongest Resume / Upwork Profile Lines
Option A (Technical emphasis): "Built and deployed a fully monetized AI-powered web application at watchfilament.com using the Anthropic Claude API, React, Vercel serverless functions, Supabase (auth + database), and Stripe — including custom prompt engineering generating structured JSON across four analytical dimensions, a hybrid IP+user rate limiting system, full authentication, and a subscription payment system with confirmed paying customers."
Option B (AI workflow emphasis): "Designed and operate an eight-agent AI framework where Claude Chat handles strategy, Claude Code handles implementation, NotebookLM handles knowledge management, and the Claude API powers the live product — with a living documentation system that maintains context across sessions and enables a solo creator to build at the speed of a small team."
Option C (Problem-solving emphasis): "Took a product idea from concept to production-deployed web app in under two weeks using AI-assisted development — engineering custom system prompts that transform raw LLM output into structured, domain-specific data, building automated content pipelines with error recovery, and creating an AI agent workflow system that coordinates strategy, development, and runtime intelligence across four different AI tools."
--------------------------------------------------------------------------------
Status Notes

| Component | Status |
|-----------|--------|
| Core app (search, constellation, guided flow) | ✅ Live in production |
| Database + rate limiting + shareable URLs | ✅ Live in production |
| v2 redesign (four thread types, new questionnaire, UX overhaul) | ✅ Complete and live |
| AI agent framework + documentation system | ✅ Operational and in active use |
| Analytics (PostHog) | ✅ Live — 5 custom funnel events tracking full conversion path |
| Payment/subscription system | ✅ Live — Stripe Monthly $6 / Annual $49 / Lifetime $79 — paying customers confirmed |
| Auth system (Google + email) | ✅ Live — Supabase Auth with hybrid rate limiting (user + IP) |
| Legal pages (ToS + Privacy Policy) | ✅ Live at watchfilament.com/terms and watchfilament.com/privacy |
| Social media automation architecture | ✅ Designed — n8n on Raspberry Pi 5, ~$2/month tool stack, @watchfilament Twitter live |
| TMDB integration (posters, streaming links) | ❌ Not yet implemented |
