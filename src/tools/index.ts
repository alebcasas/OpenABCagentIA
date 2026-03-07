import { get_current_time } from "./get_current_time.js";
import { wikipedia_search } from "./wikipedia_search.js";

export interface Tool {
  name: string;
  description: string;
  execute: (args?: Record<string, unknown>) => Promise<string>;
}

export const tools: Record<string, Tool> = {
  get_current_time,
  wikipedia_search,
};

export function runTool(
  name: string,
  args?: Record<string, unknown>
): Promise<string> {
  const tool = tools[name];
  if (!tool) return Promise.reject(new Error(`Herramienta desconocida: ${name}`));
  return tool.execute(args);
}

export function getToolsForPrompt(): string {
  return Object.entries(tools)
    .map(([name, t]) => {
      if (name === "wikipedia_search") {
        return `- ${name}: ${t.description} (ejemplo: TOOL:wikipedia_search {"query": "inteligencia artificial"})`;
      }
      return `- ${name}: ${t.description} (ejemplo: TOOL:${name})`;
    })
    .join("\n");
}
