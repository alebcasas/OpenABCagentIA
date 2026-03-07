import { loadEnv } from "./config/env.js";
import { startBot } from "./bot/index.js";
import { showChatStats } from "./memory/stats.js";

loadEnv();
console.log("Raw token:", process.env.TELEGRAM_BOT_TOKEN);
const env = loadEnv();
console.log("Parsed token:", env.TELEGRAM_BOT_TOKEN);

// Mostrar estadísticas del archivo de chat al iniciar
showChatStats().catch(console.error);

startBot().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
