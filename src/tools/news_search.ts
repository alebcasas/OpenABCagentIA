import { loadEnv } from "../config/env.js";
import type { Tool } from "./index.js";

export const news_search: Tool = {
  name: "news_search",
  description: "Busca noticias recientes usando NewsAPI. Proporciona titulares y resúmenes de noticias actuales.",
  execute: async (args?: Record<string, unknown>): Promise<string> => {
    const query = args?.query as string;
    if (!query || typeof query !== "string") {
      return "Error: Se requiere un parámetro 'query' con el término de búsqueda.";
    }

    const env = loadEnv();
    const apiKey = env.NEWSAPI_KEY;
    if (!apiKey) {
      return "Error: NEWSAPI_KEY no está configurada. Obtén una clave gratuita en https://newsapi.org/";
    }

    try {
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=es&apiKey=${apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 401) {
          return "Error: Clave de NewsAPI inválida.";
        }
        return `Error en la API de NewsAPI: ${response.status}`;
      }

      const data = await response.json() as any;

      if (!data.articles || data.articles.length === 0) {
        return `No se encontraron noticias para "${query}".`;
      }

      const articles = data.articles.slice(0, 3).map((article: any) => {
        const title = article.title || 'Sin título';
        const description = article.description || 'Sin descripción';
        const source = article.source?.name || 'Fuente desconocida';
        const publishedAt = new Date(article.publishedAt).toLocaleDateString('es-ES');
        const link = article.url || '';
        return `**${title}**\n${description}\n*Fuente: ${source} - ${publishedAt}*\n${link ? `[Leer más](${link})` : ''}`;
      }).join('\n\n');

      return `Noticias recientes sobre "${query}":\n\n${articles}`;
    } catch (error) {
      console.error("Error en news_search:", error);
      return `Error al buscar noticias: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};