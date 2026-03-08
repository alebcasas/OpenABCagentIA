# OpenABCagentIA

Agente de IA personal que corre en local y usa **Telegram** como interfaz. Integra **Groq** como LLM principal, fallbacks opcionales de OpenRouter/OpenAI, memoria en **SQLite**, registro de conversaciones en archivo, herramientas de búsqueda y clima en tiempo real.

---

## Guía Paso a Paso

### Paso 1) Requisitos previos

Necesitas:

- Node.js 18+
- Un bot de Telegram (token de @BotFather)
- Tu user ID de Telegram (para whitelist)
- API key de Groq
- (Opcional) OpenRouter / OpenAI
- (Recomendado para `/clima`) API key de WeatherAPI

---

### Paso 2) Instalar dependencias

```bash
npm install
```

---

### Paso 3) Configurar variables de entorno

Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

Edita `.env` y completa al menos:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ALLOWED_USER_IDS`
- `GROQ_API_KEY`

Variables disponibles:

- `OPENROUTER_API_KEY` (opcional)
- `OPENROUTER_MODEL` (opcional)
- `OPENAI_API_KEY` (opcional)
- `OPENAI_MODEL` (opcional)
- `NEWSAPI_KEY` (opcional)
- `WEATHERAPI_KEY` (opcional pero recomendado para `/clima`)
- `DB_PATH` (opcional)

---

### Paso 4) Ejecutar en desarrollo

```bash
npm run dev
```

> ⚠️ Importante: deja **una sola instancia** del bot corriendo. Si abres varias, Telegram devuelve error **409 Conflict**.

---

### Paso 5) Probar comandos en Telegram

Comandos disponibles:

| Comando | Qué hace | Ejemplo |
|---|---|---|
| `/search <texto>` | Búsqueda web general | `/search inteligencia artificial` |
| `/news <texto>` | Noticias recientes | `/news economia argentina` |
| `/wiki <texto>` | Resumen de Wikipedia | `/wiki Alan Turing` |
| `/fecha_y_hora` | Devuelve fecha/hora formateada | `/fecha_y_hora` |
| `/clima <ubicación>` | Clima actual por ubicación | `/clima Córdoba, Argentina` |
| `/stats` | Estadísticas del `chat_log.txt` | `/stats` |
| `/ayuda` | Muestra ayuda y ejemplos | `/ayuda` |

Compatibilidad:

- `/hora` se mantiene como alias legado de `/fecha_y_hora`.

Formato actual de fecha/hora:

- `Domingo, 8 De Marzo De 2026, 02:52HS AM`

---

### Paso 6) Entender el comando `/clima`

`/clima` usa **WeatherAPI** como proveedor principal.

Mejoras actuales implementadas:

1. Reintentos automáticos ante errores 5xx (como 504).
2. Timeout de red para evitar bloqueos.
3. Fallback automático a **wttr.in** si WeatherAPI falla temporalmente.

Si ves errores de autenticación o disponibilidad:

- `401`: API key inválida o deshabilitada.
- `504`: timeout del proveedor (debería activar fallback automático).

---

### Paso 7) Ver estadísticas del log de chat

Con `/stats` verás:

- Tamaño del archivo en MB con decimales (ej. `0.16 MB`)
- Tamaño en bytes
- Porcentaje de uso frente al límite de 10GB

El archivo se limpia automáticamente al alcanzar el límite.

---

### Paso 8) Ejecutar en producción

```bash
npm run build
npm start
```

---

## Estructura del proyecto

- `src/config/` → validación de entorno
- `src/bot/` → integración Telegram
- `src/agent/` → loop del agente
- `src/llm/` → Groq/OpenRouter/OpenAI
- `src/memory/` → SQLite + logger + stats
- `src/tools/` → herramientas (`search`, `news`, `wiki`, `fecha/hora`, `clima`)

---

## Seguridad

- No subas `.env` al repositorio.
- Usa whitelist con `TELEGRAM_ALLOWED_USER_IDS`.
- Evita ejecutar múltiples instancias del bot con el mismo token.

---

## Licencia

MIT
