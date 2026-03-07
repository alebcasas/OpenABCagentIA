import { Bot } from "grammy";
import { loadEnv } from "../config/env.js";
import { whitelistMiddleware } from "./middleware.js";
import { runAgentLoop } from "../agent/loop.js";
import { runTool } from "../tools/index.js";

let bot: Bot | null = null;

export function getBot(): Bot {
  if (!bot) {
    const env = loadEnv();
    bot = new Bot(env.TELEGRAM_BOT_TOKEN);
    bot.use(whitelistMiddleware);

    // Comando para búsqueda web general
    bot.command("search", async (ctx) => {
      const args = ctx.message?.text?.replace("/search", "").trim();
      if (!args) {
        await ctx.reply("❌ Uso: /search <término de búsqueda>\nEjemplo: /search inteligencia artificial");
        return;
      }
      try {
        await ctx.reply("🔍 Buscando en la web...");
        const result = await runTool("web_search", { query: args });
        await ctx.reply(result);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        await ctx.reply(`❌ Error: ${msg}`);
      }
    });

    // Comando para búsqueda de noticias
    bot.command("news", async (ctx) => {
      const args = ctx.message?.text?.replace("/news", "").trim();
      if (!args) {
        await ctx.reply("❌ Uso: /news <término de búsqueda>\nEjemplo: /news tecnología 2024");
        return;
      }
      try {
        await ctx.reply("📰 Buscando noticias...");
        const result = await runTool("news_search", { query: args });
        await ctx.reply(result);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        await ctx.reply(`❌ Error: ${msg}`);
      }
    });

    // Comando para búsqueda en Wikipedia
    bot.command("wiki", async (ctx) => {
      const args = ctx.message?.text?.replace("/wiki", "").trim();
      if (!args) {
        await ctx.reply("❌ Uso: /wiki <término de búsqueda>\nEjemplo: /wiki inteligencia artificial");
        return;
      }
      try {
        await ctx.reply("📚 Buscando en Wikipedia...");
        const result = await runTool("wikipedia_search", { query: args });
        await ctx.reply(result);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        await ctx.reply(`❌ Error: ${msg}`);
      }
    });

    // Comando para hora actual
    bot.command("hora", async (ctx) => {
      try {
        const result = await runTool("get_current_time");
        await ctx.reply(`⏰ ${result}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        await ctx.reply(`❌ Error: ${msg}`);
      }
    });

    // Comando de ayuda
    bot.command("ayuda", async (ctx) => {
      const helpMessage = `
🤖 **Comandos disponibles:**

📍 **Búsqueda en tiempo real:**
• /search <texto> - Busca en la web
• /news <texto> - Busca noticias
• /wiki <texto> - Busca en Wikipedia
• /hora - Muestra la hora actual

💬 **Conversación natural:**
Solo escribe tu pregunta y el bot responderá automáticamente

**Ejemplos:**
/search Python
/news inteligencia artificial
/wiki Elon Musk
/hora

¡Puedes utilizar comandos o simplemente escribir preguntas normales!`;
      await ctx.reply(helpMessage);
    });

    // Handler genérico para mensajes (conversación natural)
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
