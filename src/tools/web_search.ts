import type { Tool } from "./index.js";

type SearchResult = {
  title: string;
  description: string;
  link: string;
};

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function stripTags(text: string): string {
  return text.replace(/<[^>]*>/g, "").trim();
}

function formatResults(query: string, results: SearchResult[]): string {
  const body = results.slice(0, 3).map((item) => {
    const title = item.title || "Sin título";
    const description = item.description || "Sin descripción";
    const link = item.link || "";
    return `**${title}**\n${description}\n${link ? `[Enlace](${link})` : ""}`;
  }).join("\n\n");

  return `Resultados de búsqueda para "${query}":\n\n${body}`;
}

function collectRelatedTopics(topics: any[]): SearchResult[] {
  const results: SearchResult[] = [];

  for (const topic of topics ?? []) {
    if (Array.isArray(topic?.Topics)) {
      results.push(...collectRelatedTopics(topic.Topics));
      continue;
    }

    const text = topic?.Text as string | undefined;
    const link = topic?.FirstURL as string | undefined;
    if (text && link) {
      const title = text.split(" - ")[0] || "Sin título";
      results.push({ title, description: text, link });
    }
  }

  return results;
}

async function fetchWithTimeout(url: string, timeoutMs = 10000, headers?: Record<string, string>): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function searchDuckDuckGoApi(query: string): Promise<SearchResult[]> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  const response = await fetchWithTimeout(url, 10000, {
    "User-Agent": "Mozilla/5.0 (compatible; OpenABCagentIA/1.0)",
    "Accept": "application/json",
  });

  if (!response.ok) return [];

  const data = await response.json() as any;
  const results: SearchResult[] = [];

  if (Array.isArray(data?.Results)) {
    for (const item of data.Results) {
      const text = item?.Text as string | undefined;
      const link = item?.FirstURL as string | undefined;
      if (text && link) {
        const title = text.split(" - ")[0] || "Sin título";
        results.push({ title, description: text, link });
      }
    }
  }

  if (data?.AbstractText && data?.AbstractURL) {
    results.push({
      title: data.Heading || "Resultado destacado",
      description: data.AbstractText,
      link: data.AbstractURL,
    });
  }

  results.push(...collectRelatedTopics(data?.RelatedTopics ?? []));
  return results;
}

async function searchDuckDuckGoHtml(query: string): Promise<SearchResult[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const response = await fetchWithTimeout(url, 12000, {
    "User-Agent": "Mozilla/5.0 (compatible; OpenABCagentIA/1.0)",
    "Accept": "text/html",
  });

  if (!response.ok) return [];

  const html = await response.text();
  const results: SearchResult[] = [];

  const blockRegex = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(html)) !== null) {
    const link = decodeHtml(match[1]);
    const title = decodeHtml(stripTags(match[2]));
    const description = decodeHtml(stripTags(match[3]));

    if (title && link) {
      results.push({ title, description: description || "Sin descripción", link });
    }
  }

  return results;
}

export const web_search: Tool = {
  name: "web_search",
  description: "Busca información general en la web usando DuckDuckGo. Proporciona resultados de búsqueda con títulos, descripciones y enlaces.",
  execute: async (args?: Record<string, unknown>): Promise<string> => {
    const query = args?.query as string;
    if (!query || typeof query !== "string") {
      return "Error: Se requiere un parámetro 'query' con el término de búsqueda.";
    }

    try {
      const apiResults = await searchDuckDuckGoApi(query);
      if (apiResults.length > 0) {
        return formatResults(query, apiResults);
      }

      const htmlResults = await searchDuckDuckGoHtml(query);
      if (htmlResults.length > 0) {
        return formatResults(query, htmlResults);
      }

      return `No se encontraron resultados para "${query}". Intenta con una búsqueda más específica (por ejemplo: "proyectos Raspberry Pi 4 con sensores").`;
    } catch (error) {
      console.error("Error en web_search:", error);
      return `Error al buscar en la web: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};