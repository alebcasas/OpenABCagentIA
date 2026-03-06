import Groq from "groq-sdk";
import { loadEnv } from "../config/env.js";
import type { Message } from "../agent/types.js";

const GROQ_MODEL = "llama-3.3-70b-versatile";

let client: Groq | null = null;

function getClient(): Groq {
  if (!client) {
    const env = loadEnv();
    client = new Groq({ apiKey: env.GROQ_API_KEY });
  }
  return client;
}

export async function chatWithGroq(messages: Message[]): Promise<string> {
  const groq = getClient();
  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    max_tokens: 2048,
    temperature: 0.7,
  });
  const content = response.choices[0]?.message?.content;
  if (content == null) throw new Error("Groq no devolvió contenido");
  return content;
}

export function isRateLimitError(err: unknown): boolean {
  if (err && typeof err === "object" && "status" in err) {
    return (err as { status?: number }).status === 429;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("429") || msg.toLowerCase().includes("rate limit");
}
