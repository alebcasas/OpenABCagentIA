import dotenv from "dotenv";

// Cargar .env.example primero (plantilla), luego .env (sobrescribe)
// Así funciona si solo existe .env.example con credenciales reales
dotenv.config({ path: ".env.example" });
dotenv.config();
import { z } from "zod";

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1, "TELEGRAM_BOT_TOKEN es requerido"),
  TELEGRAM_ALLOWED_USER_IDS: z
    .string()
    .min(1, "TELEGRAM_ALLOWED_USER_IDS es requerido")
    .transform((s) =>
      s
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((n) => !Number.isNaN(n))
    ),
  GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY es requerido"),
  OPENROUTER_API_KEY: z.string().optional().default(""),
  OPENROUTER_MODEL: z.string().optional().default("openrouter/free"),
  DB_PATH: z.string().optional().default("./memory.db"),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function loadEnv(): Env {
  if (cached) return cached;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const messages = result.error.flatten().fieldErrors;
    const formatted = Object.entries(messages)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
      .join("\n");
    throw new Error(`Variables de entorno inválidas:\n${formatted}`);
  }
  cached = result.data;
  return cached;
}

export function getAllowedUserIds(): number[] {
  const env = loadEnv();
  return env.TELEGRAM_ALLOWED_USER_IDS;
}

export function hasOpenRouterFallback(): boolean {
  const env = loadEnv();
  return Boolean(env.OPENROUTER_API_KEY?.trim());
}
