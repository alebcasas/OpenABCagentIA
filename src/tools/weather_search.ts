import { z } from "zod";
import { loadEnv } from "../config/env.js";

const WeatherResponseSchema = z.object({
  location: z.object({
    name: z.string(),
    region: z.string(),
    country: z.string(),
    lat: z.number(),
    lon: z.number(),
    tz_id: z.string(),
    localtime_epoch: z.number(),
    localtime: z.string(),
  }),
  current: z.object({
    temp_c: z.number(),
    temp_f: z.number(),
    is_day: z.number(),
    condition: z.object({
      text: z.string(),
      icon: z.string(),
      code: z.number(),
    }),
    wind_mph: z.number(),
    wind_kph: z.number(),
    wind_degree: z.number(),
    wind_dir: z.string(),
    pressure_mb: z.number(),
    pressure_in: z.number(),
    precip_mm: z.number(),
    precip_in: z.number(),
    humidity: z.number(),
    cloud: z.number(),
    feelslike_c: z.number(),
    feelslike_f: z.number(),
    vis_km: z.number(),
    vis_miles: z.number(),
    uv: z.number(),
    gust_mph: z.number(),
    gust_kph: z.number(),
  }),
});

const WttrResponseSchema = z.object({
  current_condition: z.array(
    z.object({
      temp_C: z.string(),
      FeelsLikeC: z.string(),
      humidity: z.string(),
      weatherDesc: z.array(z.object({ value: z.string() })),
      windspeedKmph: z.string(),
      winddir16Point: z.string(),
      pressure: z.string(),
      visibility: z.string(),
      uvIndex: z.string(),
      localObsDateTime: z.string().optional(),
    })
  ),
  nearest_area: z
    .array(
      z.object({
        areaName: z.array(z.object({ value: z.string() })),
        region: z.array(z.object({ value: z.string() })),
        country: z.array(z.object({ value: z.string() })),
      })
    )
    .optional(),
});

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWeatherApiWithRetry(url: string, retries = 2): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, 10000);

      if (response.status >= 500) {
        if (attempt < retries) {
          await wait(400 * (attempt + 1));
          continue;
        }
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Error de red desconocido");
      if (attempt < retries) {
        await wait(400 * (attempt + 1));
        continue;
      }
    }
  }

  throw lastError ?? new Error("No se pudo consultar la API de clima");
}

async function fetchWttrFallback(location: string): Promise<string> {
  const fallbackUrl = `https://wttr.in/${encodeURIComponent(location)}?format=j1&lang=es`;
  const response = await fetchWithTimeout(fallbackUrl, 10000);
  if (!response.ok) {
    throw new Error(`Error en servicio alternativo de clima: ${response.status}`);
  }

  const data = await response.json();
  const parsed = WttrResponseSchema.parse(data);

  const current = parsed.current_condition[0];
  const area = parsed.nearest_area?.[0];
  const areaName = area?.areaName?.[0]?.value ?? location;
  const region = area?.region?.[0]?.value ?? "";
  const country = area?.country?.[0]?.value ?? "";
  const condition = current.weatherDesc?.[0]?.value ?? "Sin descripción";
  const locationLine = [areaName, region, country].filter(Boolean).join(", ");

  return `🌤️ **Clima en ${locationLine}** (fuente alternativa)

**Temperatura:** ${current.temp_C}°C
**Sensación térmica:** ${current.FeelsLikeC}°C
**Condición:** ${condition}
**Humedad:** ${current.humidity}%
**Viento:** ${current.windspeedKmph} km/h desde ${current.winddir16Point}
**Presión:** ${current.pressure} mb
**Visibilidad:** ${current.visibility} km
**UV Index:** ${current.uvIndex}

🕐 **Hora local observada:** ${current.localObsDateTime ?? "No disponible"}`;
}

export const weather_search = {
  name: "weather_search",
  description: "Obtiene el clima actual de una ubicación específica. Uso: TOOL:weather_search {\"location\": \"Córdoba, Argentina\"}",
  execute: async (args?: { location?: string }): Promise<string> => {
    if (!args?.location) {
      return "Error: Debes proporcionar una ubicación. Uso: TOOL:weather_search {\"location\": \"Ciudad, País\"}";
    }

    const env = loadEnv();
    const apiKey = env.WEATHERAPI_KEY?.trim();
    if (!apiKey) {
      return "Error: WEATHERAPI_KEY no está configurada. Crea una clave gratis en https://www.weatherapi.com/ y agrégala al archivo .env";
    }

    try {
      const url = `https://api.weatherapi.com/v1/current.json?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(args.location)}&lang=es`;
      const response = await fetchWeatherApiWithRetry(url);
      
      if (!response.ok) {
        if (response.status >= 500) {
          return await fetchWttrFallback(args.location);
        }
        throw new Error(`Error en la API de clima: ${response.status}`);
      }

      const data = await response.json();
      
      // Validamos la respuesta con Zod
      const validatedData = WeatherResponseSchema.parse(data);

      const { location, current } = validatedData;
      
      // Determinamos si es día o noche
      const timeOfDay = current.is_day === 1 ? "de día" : "de noche";
      
      // Formateamos la respuesta
      const weatherInfo = `🌤️ **Clima en ${location.name}, ${location.region}, ${location.country}** (${timeOfDay})

**Temperatura:** ${current.temp_c}°C (${current.temp_f}°F)
**Sensación térmica:** ${current.feelslike_c}°C
**Condición:** ${current.condition.text}
**Humedad:** ${current.humidity}%
**Nubosidad:** ${current.cloud}%
**Viento:** ${current.wind_kph} km/h (${current.wind_mph} mph) desde ${current.wind_dir}
**Presión:** ${current.pressure_mb} mb
**Visibilidad:** ${current.vis_km} km
**UV Index:** ${current.uv}

📍 **Coordenadas:** ${location.lat}°, ${location.lon}°
🕐 **Hora local:** ${location.localtime}`;

      return weatherInfo;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return `Error al procesar los datos del clima: ${error.message}`;
      }

      try {
        return await fetchWttrFallback(args.location);
      } catch {
        // Continuar con el error original
      }

      return `Error al obtener el clima para "${args.location}": ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
};