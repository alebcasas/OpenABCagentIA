# OpenABCagentIA

Agente de IA personal que corre en local y usa Telegram como interfaz. Usa **Groq** (Llama 3.3 70B) como LLM principal, con fallbacks opcionales en **OpenRouter** y **OpenAI/ChatGPT**. Memoria persistente con SQLite.

## Requisitos

- Node.js 18+
- Cuenta de Telegram y token de bot
- API key de [Groq](https://console.groq.com/) (recomendado para mejor rendimiento y velocidad)
- (Opcional) API key de [OpenRouter](https://openrouter.ai/) — como fallback cuando Groq tiene límites de tasa
- (Opcional) API key de [OpenAI](https://platform.openai.com/) — para usar ChatGPT/GPT-4 como fallback adicional

## Instalación

```bash
npm install
```

Copia el archivo de ejemplo y rellena las variables:

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

- `TELEGRAM_BOT_TOKEN`: Token del bot de Telegram (obtén uno en [@BotFather](https://t.me/botfather)).
- `TELEGRAM_ALLOWED_USER_IDS`: Tu ID de usuario de Telegram (o varios separados por comas).
- `GROQ_API_KEY`: Tu clave API de Groq (https://console.groq.com/keys).
- `OPENROUTER_API_KEY` y `OPENROUTER_MODEL`: Opcionales. Si están configurados y tienes límite de tasa en Groq, se usarán como fallback.
- `OPENAI_API_KEY`: Opcional. Tu clave API de OpenAI para usar ChatGPT/GPT-4 como fallback adicional (obtén una en https://platform.openai.com/api-keys).
- `OPENAI_MODEL`: Opcional. Modelo a usar (por defecto `gpt-4`, también puedes usar `gpt-3.5-turbo` para menor costo).

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
- `src/llm/` — Integraciones de LLM:
  - **Groq** (principal) — Más rápido y económico, usa Llama 3.3 70B.
  - **OpenRouter** (fallback) — Alternativa a Groq cuando hay límites de tasa.
  - **OpenAI** (fallback) — ChatGPT/GPT-4 para máxima calidad cuando sea necesario.
- `src/memory/` — Memoria persistente con SQLite (better-sqlite3).
- `src/tools/` — Herramientas (p. ej. `get_current_time`).

## Herramientas

El agente puede usar herramientas para obtener información actualizada. Disponibles:

- **get_current_time**: Devuelve la fecha y hora actual en ISO 8601. (ejemplo: TOOL:get_current_time)
- **wikipedia_search**: Busca información en Wikipedia y proporciona un resumen de la página más relevante. (ejemplo: TOOL:wikipedia_search {"query": "inteligencia artificial"})

Para añadir más, crea un módulo en `src/tools/` y regístralo en `src/tools/index.ts`.

## Seguridad

- Credenciales solo en `.env` (no versionado).
- Whitelist de usuarios de Telegram.
- Sin dependencias de skills externas no verificadas.
- Ejecución local por defecto.

## Licencia

MIT
