# OpenABCagentIA

Agente de IA personal que corre en local y usa Telegram como interfaz. Usa Groq (Llama 3.3 70B) como LLM principal y OpenRouter como fallback opcional. Memoria persistente con SQLite.

## Requisitos

- Node.js 18+
- Cuenta de Telegram y token de bot
- API key de [Groq](https://console.groq.com/)
- (Opcional) API key de [OpenRouter](https://openrouter.ai/) para fallback

## Instalación

```bash
npm install
```

Copia el archivo de ejemplo y rellena las variables:

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

- `TELEGRAM_BOT_TOKEN`: Token del bot (BotFather).
- `TELEGRAM_ALLOWED_USER_IDS`: Tu user ID de Telegram (o varios separados por comas).
- `GROQ_API_KEY`: Tu API key de Groq.
- `OPENROUTER_API_KEY` y `OPENROUTER_MODEL`: Opcionales; si están configurados, se usan cuando Groq devuelve 429.

## Uso

Modo desarrollo (reinicio automático):

```bash
npm run dev
```

Modo producción:

```bash
npm run build
npm start
```

El bot usa **long polling** (no necesita servidor web ni URL pública). Solo usuarios en `TELEGRAM_ALLOWED_USER_IDS` pueden usarlo.

## Estructura

- `src/config/` — Variables de entorno y validación (Zod).
- `src/bot/` — Bot de Telegram (Grammy), whitelist, long polling.
- `src/agent/` — Bucle del agente y tipos.
- `src/llm/` — Groq (principal) y OpenRouter (fallback).
- `src/memory/` — Memoria persistente con SQLite (better-sqlite3).
- `src/tools/` — Herramientas (p. ej. `get_current_time`).

## Herramientas

El agente puede usar herramientas. Por ahora está disponible:

- **get_current_time**: Devuelve la fecha y hora actual en ISO 8601.

Para añadir más, crea un módulo en `src/tools/` y regístralo en `src/tools/index.ts`.

## Seguridad

- Credenciales solo en `.env` (no versionado).
- Whitelist de usuarios de Telegram.
- Sin dependencias de skills externas no verificadas.
- Ejecución local por defecto.

## Licencia

MIT
