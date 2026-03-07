import type { Tool } from "./index.js";

export const web_search: Tool = {
  name: "web_search",
  description: "Busca información general en la web usando DuckDuckGo. Proporciona resultados de búsqueda con títulos, descripciones y enlaces.",
  execute: async (args?: Record<string, unknown>): Promise<string> => {
    const query = args?.query as string;
    if (!query || typeof query !== "string") {
      return "Error: Se requiere un parámetro 'query' con el término de búsqueda.";
    }

    try {
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      const response = await fetch(url);
      const data = await response.json() as any;

      if (!data || !data.RelatedTopics || data.RelatedTopics.length === 0) {
        return `No se encontraron resultados para "${query}".`;
      }

      const results = data.RelatedTopics.slice(0, 3).map((topic: any) => {
        const title = topic.Text?.split(' - ')[0] || 'Sin título';
        const description = topic.Text || 'Sin descripción';
        const link = topic.FirstURL || '';
        return `**${title}**\n${description}\n${link ? `[Enlace](${link})` : ''}`;
      }).join('\n\n');

      return `Resultados de búsqueda para "${query}":\n\n${results}`;
    } catch (error) {
      console.error("Error en web_search:", error);
      return `Error al buscar en la web: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};