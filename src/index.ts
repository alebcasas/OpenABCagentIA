import { loadEnv } from "./config/env.js";
import { startBot } from "./bot/index.js";

loadEnv();
console.log("Raw token:", process.env.TELEGRAM_BOT_TOKEN);
const env = loadEnv();
console.log("Parsed token:", env.TELEGRAM_BOT_TOKEN);
startBot().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
