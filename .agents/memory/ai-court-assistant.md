---
name: AI court assistant
description: How the natural-language court-update feature is wired and why it uses a bring-your-own OpenAI key.
---

# AI court-update assistant

A prompt bar on the map view sends free-text commands to a server endpoint that uses an LLM to extract a court-name query + player-count changes, fuzzy-matches the court, and applies the update.

## Bring-your-own OpenAI key (not the managed integration)
The Replit-managed OpenAI integration (`setupReplitAIIntegrations`) returned `awaiting_phone_verification`, and the user opted to supply their own key. So this project reads **`OPENAI_API_KEY`** directly via the `openai` SDK in the api-server, NOT the `@workspace/integrations-openai-ai-*` template packages.

**Why:** managed integration was unavailable; user provided their own key.
**How to apply:** if extending AI features here, use `getOpenAI()` (lazy client on `OPENAI_API_KEY`). Don't assume the integration env vars (`AI_INTEGRATIONS_OPENAI_*`) exist.

## Quota gotcha
The provided key has hit `429 insufficient_quota` — the feature is fully built and verified at every layer except the live LLM call, which needs OpenAI billing/credit on that account. The endpoint maps 429→503 with a user-facing "no available quota" message; 401→503 "invalid key".

## Court matching
Server-side fuzzy match expands abbreviations (ps→public school, jr→junior, etc.) and weights distinctive tokens above generic ones (school/public/park/...). Returns single match, ambiguous-candidates, or none. Note: the dataset is parks-with-courts + schools only — famous parks like Trinity Bellwoods are NOT present, so they correctly resolve to not-found.
