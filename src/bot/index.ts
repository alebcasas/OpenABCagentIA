import { Bot } from "grammy";
import { loadEnv } from "../config/env.js";
import { whitelistMiddleware } from "./middleware.js";
import { runAgentLoop } from "../agent/loop.js";
import { runTool } from "../tools/index.js";
import { chatLogger } from "../memory/chatLogger.js";
import { showChatStats } from "../memory/stats.js";

let bot: Bot | null = null;

export function getBot(): Bot {
  if (!bot) {
    const env = loadEnv();
    bot = new Bot(env.TELEGRAM_BOT_TOKEN);
    bot.use(whitelistMiddleware);

    // Registrar comandos en Telegram para que se muestren automáticamente al escribir "/"
    bot.api.setMyCommands([
      { command: "search", description: "🔍 Busca en la web" },
      { command: "news", description: "📰 Busca noticias" },
      { command: "wiki", description: "📚 Busca en Wikipedia" },
      { command: "hora", description: "⏰ Muestra la hora actual" },
      { command: "ayuda", description: "🤖 Muestra todos los comandos" },
    ]).catch(() => {
      console.warn("No se pudieron registrar los comandos en Telegram");
    });

    // Middleware para detectar cuando se escribe solo "/" y mostrar el menú
    bot.use(async (ctx, next) => {
      const text = ctx.message?.text;
      if (text === "/") {
        const helpMessage = `🤖 **Comandos disponibles:**

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
        return; // No continuar con otros handlers
      }
      await next();
    });

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

📊 **Estadísticas:**
• /stats - Muestra estadísticas del archivo de chat

💬 **Conversación natural:**
Solo escribe tu pregunta y el bot responderá automáticamente

**Ejemplos:**
/search Python
/news inteligencia artificial
/wiki Elon Musk
/hora
/stats

¡Puedes utilizar comandos o simplemente escribir preguntas normales!`;
      await ctx.reply(helpMessage);
    });

    // Comando para estadísticas del archivo de chat
    bot.command("stats", async (ctx) => {
      try {
        const stats = await chatLogger.getLogFileStats();
        
        let response = `📊 **Estadísticas del Archivo de Chat**\n\n`;
        response += `📁 **Archivo:** ${stats.exists ? "Existe" : "No existe"}\n`;
        response += `📏 **Tamaño:** ${stats.sizeMB} MB (${stats.size} bytes)\n`;
        response += `⚠️ **Límite:** 10240 MB (10GB)\n`;
        
        if (stats.exists) {
          const percentage = (stats.sizeMB / 10240) * 100;
          response += `📈 **Uso:** ${percentage.toFixed(2)}%\n\n`;
          
          if (percentage > 80) {
            response += `⚠️ **ADVERTENCIA:** El archivo está cerca del límite de 10GB\n`;
          } else if (percentage > 50) {
            response += `💡 **Nota:** El archivo está a más de la mitad de su capacidad\n`;
          } else {
            response += `✅ **Estado:** El archivo tiene suficiente espacio disponible\n`;
          }
        }
        
        await ctx.reply(response);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        await ctx.reply(`❌ Error al obtener estadísticas: ${msg}`);
      }
    });

    // Handler genérico para mensajes (conversación natural)
    bot.on("message:text", async (ctx) => {
      const text = ctx.message.text;
      const userId = ctx.from?.id;
      if (!text || userId == null) return;
      
      // Registrar el mensaje del usuario en el archivo de chat
      await chatLogger.logChat(userId, "user", text);
      
      try {
        await ctx.reply("Pensando...");
        const response = await runAgentLoop(userId, text);
        await ctx.reply(response);
        
        // Registrar la respuesta del bot en el archivo de chat
        await chatLogger.logChat(userId, "assistant", response);
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
    } else if (err instanceof Error && err.message.includes('409')) {
      console.error("❌ Error 409: Conflicto - El bot ya está en ejecución en otro lugar.");
      console.error("Asegúrate de que solo haya una instancia del bot corriendo.");
      console.error("Si estás usando Webhooks, verifica que no haya otro bot con el mismo token.");
      process.exit(1);
    } else {
      throw err;
    }
  }
  console.log("OpenABCagentIA bot en marcha (long polling).");
}
