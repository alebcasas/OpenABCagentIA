import type { Message } from "./types.js";
import { chat } from "../llm/index.js";
import { MemoryStore } from "../memory/index.js";
import { runTool, getToolsForPrompt, tools } from "../tools/index.js";

const MAX_ITERATIONS = 8;
const RECENT_MESSAGES = 20;
const TOOL_PATTERN = /TOOL:\s*(\w+)\s*(\{[\s\S]*?\})/gi;

const SYSTEM_PROMPT = `Eres OpenABCagentIA, un asistente de IA integrado con herramientas de búsqueda en tiempo real.

**⚠️ INSTRUCCIÓN CRÍTICA Y OBLIGATORIA:**
PARA CUALQUIER PREGUNTA QUE CONTENGA: noticias, eventos, actualidad, conflictos, guerra, protestas, política actual, economía actual, tecnología reciente, clima, precios de hoy, deportes, entretenimiento, o cualquier tema que requiera información DESPUÉS de 2022:

1. DEBES ejecutar una herramienta de búsqueda INMEDIATAMENTE
2. NUNCA respondas "no tengo acceso a internet" - eso es una excusa prohibida
3. DEBES usar TOOL: antes de responder

**MATRIZ DE SELECCIÓN DE HERRAMIENTAS:**
- Pregunta sobre "noticias" O "actualidad" O "hoy" → TOOL:news_search {"query": "AQUÍ VA LA BÚSQUEDA"}
- Pregunta sobre conflicto, guerra, protestas → TOOL:news_search {"query": "AQUÍ VA LA BÚSQUEDA"}
- Pregunta sobre "¿Qué está pasando?" → TOOL:news_search {"query": "AQUÍ VA LA BÚSQUEDA"}
- Pregunta sobre una entidad/persona/concepto → TOOL:web_search {"query": "AQUÍ VA LA BÚSQUEDA"}
- Pregunta sobre biografía histórica → TOOL:wikipedia_search {"query": "AQUÍ VA LA BÚSQUEDA"}
- Pregunta sobre hora/fecha actual → TOOL:get_current_time

**EJEMPLOS PARA SEGUIR AL PIE DE LA LETRA:**
Usuario: "¿Qué está pasando en Irán?"
Tu respuesta DEBE ser: TOOL:news_search {"query": "Irán actualidad"}

Usuario: "Busca noticias sobre la guerra"
Tu respuesta DEBE ser: TOOL:news_search {"query": "guerra actualidad"}

Usuario: "¿Quién es Elon Musk?"
Tu respuesta: TOOL:web_search {"query": "Elon Musk"}

Herramientas disponibles:
${getToolsForPrompt()}

**DESPUÉS de ejecutar la herramienta, responde natural y amigablemente con los resultados.**
Responde en español o en el idioma del usuario.`;



function parseToolCalls(text: string): Array<{ name: string; args?: Record<string, unknown> }> {
  const calls: Array<{ name: string; args?: Record<string, unknown> }> = [];
  let m: RegExpExecArray | null;
  TOOL_PATTERN.lastIndex = 0;
  while ((m = TOOL_PATTERN.exec(text)) !== null) {
    const name = m[1];
    const argsStr = m[2];
    let args: Record<string, unknown> | undefined;
    if (argsStr) {
      try {
        args = JSON.parse(argsStr);
      } catch (e) {
        console.warn(`Error parsing args for ${name}: ${argsStr}`);
      }
    }
    if (tools[name]) calls.push({ name, args });
  }
  return calls;
}

export async function runAgentLoop(
  telegramUserId: number,
  userMessage: string
): Promise<string> {
  MemoryStore.add(telegramUserId, "user", userMessage);

  const recent = MemoryStore.getRecent(telegramUserId, RECENT_MESSAGES);
  const history: Message[] = recent.map((r) => ({
    role: r.role as "user" | "assistant",
    content: r.content,
  }));

  const messages: Message[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
  ];

  let iterations = 0;
  let lastContent = "";

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    const content = await chat(messages);
    lastContent = content.trim();

    const toolCalls = parseToolCalls(content);
    if (toolCalls.length === 0) {
      MemoryStore.add(telegramUserId, "assistant", lastContent);
      return lastContent;
    }

    for (const { name, args } of toolCalls) {
      try {
        const result = await runTool(name, args);
        messages.push({
          role: "assistant",
          content,
        });
        messages.push({
          role: "user",
          content: `[Resultado de ${name}]: ${result}`,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        messages.push({ role: "assistant", content });
        messages.push({
          role: "user",
          content: `[Error en ${name}]: ${msg}`,
        });
      }
    }
  }

  MemoryStore.add(telegramUserId, "assistant", lastContent);
  return lastContent || "He llegado al límite de pasos. Resumen: revisa el historial.";
}
