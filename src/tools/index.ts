import { get_current_time } from "./get_current_time.js";
import { wikipedia_search } from "./wikipedia_search.js";
import { web_search } from "./web_search.js";
import { news_search } from "./news_search.js";
import { weather_search } from "./weather_search.js";

export interface Tool {
  name: string;
  description: string;
  execute: (args?: Record<string, unknown>) => Promise<string>;
}

export const tools: Record<string, Tool> = {
  get_current_time,
  wikipedia_search,
  web_search,
  news_search,
  weather_search,
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
      if (name === "wikipedia_search" || name === "web_search" || name === "news_search") {
        return `- ${name}: ${t.description} (ejemplo: TOOL:${name} {"query": "tu búsqueda"})`;
      } else if (name === "weather_search") {
        return `- ${name}: ${t.description} (ejemplo: TOOL:${name} {"location": "Córdoba, Argentina"})`;
      }
      return `- ${name}: ${t.description} (ejemplo: TOOL:${name})`;
    })
    .join("\n");
}
