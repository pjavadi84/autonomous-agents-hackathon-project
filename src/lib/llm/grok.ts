import OpenAI from "openai";

// Grok uses the OpenAI-compatible API format
const grok = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

export const GROK_MODEL = "grok-3-fast";

export default grok;
