# Filament 🎬

**Find films by feeling, not genre.** Live at **[watchfilament.com](https://watchfilament.com)**

Search for a film you love, or answer three quick questions about your mood. Filament maps 8–12 connected films and shows the threads that link them: shared themes, craft, creative philosophy and cinematic lineage. It's all drawn as an interactive constellation you can explore and share.

**Status:** live in production, with user accounts, Stripe subscriptions and paying customers.

---

## The hard part: getting the AI to produce something worth reading

Any chatbot can list movies. The challenge was getting the AI to produce specific, surprising connections, reliably, in a structure the app could draw. Most of the work was a loop: **read the output → find what's wrong → fix the instruction → test again.**

| Problem I found in the output | What I changed |
|---|---|
| Early results skewed heavily toward one genre (horror) | Redesigned the prompt around four types of connection, with a rule for how many of each to include, so no single dimension dominates |
| Descriptions read like encyclopedia entries | Added explicit writing rules: thread names must be "specific, never generic genre labels"; pitch lines must not be plot summaries |
| The AI sometimes invented films or got years wrong | Added a hard rule to return only real titles with correct years |
| Preview teasers described the film you searched for instead of the recommendations, and ran long | Rewrote the teaser prompt to point at the recommended films, with an enforced 8–15 word limit |
| Mood answers sent as raw tags ("folklore, ancient evil") gave flat results | Turned each answer into a full-sentence description before sending it to the AI |
| Responses occasionally came back in the wrong format and broke the page | Required structured output only, with a safety net that cleans up stray formatting and handles each type of failure separately |

---

## How I built it

I'm not a developer. I build through AI orchestration. I made the product and architecture decisions, wrote and tuned the prompts, and tested every output. Claude Code wrote the code.

| Part | Tool |
|---|---|
| AI engine | Anthropic Claude API |
| App | React, hosted on Vercel |
| Accounts and database | Supabase (Google and email sign-in, row-level security) |
| Payments | Stripe (monthly, annual and lifetime plans) |
| Usage limits | 3 free searches a day; unlimited for Pro |
| Analytics | PostHog conversion funnel |

**Security:** API keys live only on the server. The browser never sees them.

## What's in this repo

| Path | What it is |
|---|---|
| [`src/`](src/) | The React app |
| [`api/`](api/) | Serverless functions that call the AI, handle payments and enforce limits |
| [`supabase-schema.sql`](supabase-schema.sql) | Database tables and access rules |
| [`docs/`](docs/) | Product, strategy and infrastructure notes |
