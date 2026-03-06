import { loadEnv } from "../config/env.js";
import type { Message } from "../agent/types.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function chatWithOpenRouter(messages: Message[]): Promise<string> {
  const env = loadEnv();
  if (!env.OPENROUTER_API_KEY?.trim()) {
    throw new Error("OPENROUTER_API_KEY no configurado");
  }
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/OpenABCagentIA",
      "X-Title": "OpenABCagentIA",
    },
    body: JSON.stringify({
      model: env.OPENROUTER_MODEL,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${text}`);
  }
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (content == null) throw new Error("OpenRouter no devolvió contenido");
  return content;
}
