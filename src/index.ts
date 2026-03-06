import { loadEnv } from "./config/env.js";
import { startBot } from "./bot/index.js";

loadEnv();
startBot().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
