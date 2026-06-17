import OpenAI from "openai";

let client: OpenAI | null = null;

/**
 * Lazily construct the OpenAI client so the server still boots when no provider
 * is configured (the AI endpoint then returns a graceful error instead).
 *
 * Prefers the Replit AI Integrations OpenAI proxy (no personal API key needed,
 * billed to Replit credits). Falls back to a direct OPENAI_API_KEY if present.
 */
export function getOpenAI(): OpenAI | null {
  if (client) return client;

  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const proxyKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (baseURL && proxyKey) {
    client = new OpenAI({ baseURL, apiKey: proxyKey });
    return client;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    client = new OpenAI({ apiKey });
    return client;
  }

  return null;
}
