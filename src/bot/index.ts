import { Bot } from "grammy";
import { loadEnv } from "../config/env.js";
import { whitelistMiddleware } from "./middleware.js";
import { runAgentLoop } from "../agent/loop.js";

let bot: Bot | null = null;

export function getBot(): Bot {
  if (!bot) {
    const env = loadEnv();
    bot = new Bot(env.TELEGRAM_BOT_TOKEN);
    bot.use(whitelistMiddleware);
    bot.on("message:text", async (ctx) => {
      const text = ctx.message.text;
      const userId = ctx.from?.id;
      if (!text || userId == null) return;
      try {
        await ctx.reply("Pensando...");
        const response = await runAgentLoop(userId, text);
        await ctx.reply(response);
      } catch (err) {
        console.error("Error en agent loop:", err);
        const msg =
          err instanceof Error ? err.message : "Error interno. Intenta más tarde.";
        await ctx.reply(`Error: ${msg}`);
      }
    });
  }
  return bot;
}

export async function startBot(): Promise<void> {
  const b = getBot();
  try {
    await b.start({ drop_pending_updates: true });
  } catch (err) {
    if (err instanceof Error && err.message.includes('deleteWebhook') && err.message.includes('404')) {
      console.warn("Webhook no encontrado (404), iniciando polling de todas formas...");
      await b.start({ drop_pending_updates: true, allowed_updates: [] });
    } else {
      throw err;
    }
  }
  console.log("OpenABCagentIA bot en marcha (long polling).");
}
