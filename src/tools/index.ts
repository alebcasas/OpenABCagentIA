import { get_current_time } from "./get_current_time.js";

export interface Tool {
  name: string;
  description: string;
  execute: (args?: Record<string, unknown>) => Promise<string>;
}

export const tools: Record<string, Tool> = {
  get_current_time,
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
    .map(
      ([name, t]) =>
        `- ${name}: ${t.description} (sin argumentos)`
    )
    .join("\n");
}
