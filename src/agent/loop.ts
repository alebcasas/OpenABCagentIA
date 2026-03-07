import type { Message } from "./types.js";
import { chat } from "../llm/index.js";
import { MemoryStore } from "../memory/index.js";
import { runTool, getToolsForPrompt, tools } from "../tools/index.js";

const MAX_ITERATIONS = 8;
const RECENT_MESSAGES = 20;
const TOOL_PATTERN = /TOOL:\s*(\w+)\s*(\{.*\})/gi;

const SYSTEM_PROMPT = `Eres OpenABCagentIA, un asistente útil que puede usar herramientas.
Para usar una herramienta, escribe exactamente: TOOL:nombre_herramienta {"param1": "valor1", "param2": "valor2"}
Solo una herramienta por respuesta. Cuando tengas el resultado, responde al usuario con un mensaje natural.

Herramientas disponibles:
${getToolsForPrompt()}

Responde siempre en el mismo idioma que el usuario. Si no necesitas ninguna herramienta, responde directamente.`;

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
