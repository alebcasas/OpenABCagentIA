import type { Tool } from "./index.js";

export const wikipedia_search: Tool = {
  name: "wikipedia_search",
  description: "Busca información en Wikipedia. Proporciona un resumen de la página más relevante para el término de búsqueda.",
  execute: async (args?: Record<string, unknown>): Promise<string> => {
    const query = args?.query as string;
    if (!query || typeof query !== "string") {
      return "Error: Se requiere un parámetro 'query' con el término de búsqueda.";
    }

    try {
      // Primero buscar el título más relevante
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&format=json`;
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json() as any;

      if (!searchData[1] || searchData[1].length === 0) {
        return `No se encontraron resultados en Wikipedia para "${query}".`;
      }

      const title = searchData[1][0];

      // Obtener el resumen de la página
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
      const summaryResponse = await fetch(summaryUrl);

      if (!summaryResponse.ok) {
        return `Error al obtener información de Wikipedia para "${query}".`;
      }

      const summaryData = await summaryResponse.json() as any;

      const result = `**${summaryData.title}**\n\n${summaryData.extract}\n\n${summaryData.content_urls?.desktop?.page ? `[Leer más](${summaryData.content_urls.desktop.page})` : ''}`;

      return result;
    } catch (error) {
      console.error("Error en wikipedia_search:", error);
      return `Error al buscar en Wikipedia: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};