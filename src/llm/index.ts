import type { Message } from "../agent/types.js";
import { chatWithGroq, isRateLimitError } from "./groq.js";
import { chatWithOpenRouter } from "./openrouter.js";
import { hasOpenRouterFallback } from "../config/env.js";

export async function chat(messages: Message[]): Promise<string> {
  try {
    return await chatWithGroq(messages);
  } catch (err) {
    if (isRateLimitError(err) && hasOpenRouterFallback()) {
      return chatWithOpenRouter(messages);
    }
    throw err;
  }
}
