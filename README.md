# OpenABCagentIA

Agente de IA personal que corre en local y usa Telegram como interfaz. Usa **Groq** (Llama 3.3 70B) como LLM principal, con fallbacks opcionales en **OpenRouter** y **OpenAI/ChatGPT**. Memoria persistente con SQLite y registro de conversaciones en archivo con límite de 10GB.

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
- `NEWSAPI_KEY`: Opcional; clave gratuita de NewsAPI para búsqueda de noticias (obtén una en https://newsapi.org/).

## Uso

### Conversación natural (automática):
Solo escribe mensajes naturales y el bot responderá inteligentemente, buscando en tiempo real cuando sea necesario.

Ejemplos:
- "¿Qué noticias hay hoy?"
- "¿Quién es Elon Musk?"
- "Explícame sobre inteligencia artificial"

### Comandos explícitos (búsqueda directa):

| Comando | Uso | Ejemplo |
|---------|-----|---------|
| `/search <texto>` | Busca en la web (general) | `/search Python programming` |
| `/news <texto>` | Busca noticias recientes | `/news inteligencia artificial 2024` |
| `/wiki <texto>` | Busca en Wikipedia | `/wiki Albert Einstein` |
| `/hora` | Muestra la hora actual | `/hora` |
| `/stats` | Muestra estadísticas del archivo de chat | `/stats` |
| `/ayuda` | Muestra todos los comandos | `/ayuda` |

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
- `src/memory/` — Memoria persistente con SQLite (better-sqlite3) y registro de conversaciones en archivo.
  - **chatLogger.ts** — Sistema de registro de chats con límite de 10GB y auto-limpieza.
  - **stats.ts** — Funciones para mostrar estadísticas del archivo de chat.
- `src/tools/` — Herramientas (p. ej. `get_current_time`).

## Herramientas

El agente puede usar herramientas para obtener información actualizada. Disponibles:

- **get_current_time**: Devuelve la fecha y hora actual en ISO 8601. (ejemplo: TOOL:get_current_time)
- **wikipedia_search**: Busca información en Wikipedia y proporciona un resumen de la página más relevante. (ejemplo: TOOL:wikipedia_search {"query": "inteligencia artificial"})
- **web_search**: Busca información general en la web usando DuckDuckGo. (ejemplo: TOOL:web_search {"query": "noticias tecnología"})
- **news_search**: Busca noticias recientes usando NewsAPI. Requiere NEWSAPI_KEY. (ejemplo: TOOL:news_search {"query": "elecciones 2024"})

Para añadir más, crea un módulo en `src/tools/` y regístralo en `src/tools/index.ts`.

## Sistema de Registro de Chats

El bot incluye un sistema avanzado de registro de conversaciones:

### 📁 **Registro Automático**
- **Archivo de chat**: `chat_log.txt` en la raíz del proyecto
- **Formato estructurado**: Timestamp, ID de usuario, rol y contenido
- **Registro en tiempo real**: Cada mensaje del usuario y respuesta del bot se guarda automáticamente

### 🎯 **Límite y Auto-limpieza**
- **Tamaño máximo**: 10GB (10,737,418,240 bytes)
- **Auto-limpieza**: El archivo se vacía automáticamente al alcanzar el límite
- **Sin interrupciones**: El registro no afecta el funcionamiento normal del bot

### 📊 **Comando `/stats`**
Muestra estadísticas detalladas del archivo de chat:
- Estado del archivo (existe/no existe)
- Tamaño actual en MB y bytes
- Porcentaje de uso respecto al límite de 10GB
- Alertas cuando el archivo está cerca del límite (más del 80%)
- Recomendaciones según el nivel de uso

### 🔧 **Mensajes Largos**
El bot maneja automáticamente mensajes largos que excedan el límite de Telegram (4096 caracteres):
- **División automática**: Mensajes largos se dividen en fragmentos de máximo 4000 caracteres
- **Entrega secuencial**: Los fragmentos se envían uno tras otro manteniendo el contenido completo
- **Sin pérdida de información**: Todo el contenido se entrega al usuario

## Seguridad

- Credenciales solo en `.env` (no versionado).
- Whitelist de usuarios de Telegram.
- Sin dependencias de skills externas no verificadas.
- Ejecución local por defecto.
- Archivo de chat protegido: No contiene credenciales ni información sensible

## Licencia

MIT
