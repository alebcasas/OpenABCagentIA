import type { Message } from "./types.js";
import { chat } from "../llm/index.js";
import { MemoryStore } from "../memory/index.js";
import { runTool, getToolsForPrompt, tools } from "../tools/index.js";

const MAX_ITERATIONS = 8;
const RECENT_MESSAGES = 20;
const TOOL_PATTERN = /TOOL:\s*(\w+)\s*(\{.*\})/gi;

const SYSTEM_PROMPT = `Eres OpenABCagentIA, un asistente inteligente que SIEMPRE usa herramientas para información actualizada.

**REGLAS CRÍTICAS:**
1. Para CUALQUIER pregunta sobre: noticias, eventos actuales, información reciente, clima, precios, estadísticas del día = USA news_search O web_search
2. Para preguntas sobre temas específicos (personas, conceptos, historia) = USA wikipedia_search
3. Para preguntas sobre la hora actual = USA get_current_time
4. NUNCA respondas "no tengo acceso a internet" - SIEMPRE usa las herramientas disponibles

**Ejemplos de cuándo buscar:**
- "¿Qué noticias hay hoy?" → TOOL:news_search {"query": "noticias hoy"}
- "Dime sobre Irán" → TOOL:web_search {"query": "Irán"}
- "¿Hay conflictos en Irán?" → TOOL:news_search {"query": "conflicto Irán"}
- "¿Quién es Elon Musk?" → TOOL:wikipedia_search {"query": "Elon Musk"}
- "¿Qué hora es?" → TOOL:get_current_time

**Cómo usar herramientas:**
Para usar una herramienta, escribe EXACTAMENTE: TOOL:nombre_herramienta {"param1": "valor1"}
Ejemplo: TOOL:news_search {"query": "tu búsqueda aquí"}

Herramientas disponibles:
${getToolsForPrompt()}

IMPORTANTE: Después de cada búsqueda, SIEMPRE responde al usuario con los resultados en lenguaje natural y amigable.
Responde siempre en el mismo idioma que el usuario (español preferentemente).`;


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
