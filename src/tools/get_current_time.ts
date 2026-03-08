export const get_current_time = {
  name: "get_current_time",
  description:
    "Obtiene la fecha y hora actual en formato legible para Argentina (Córdoba).",
  execute: async (): Promise<string> => {
    const now = new Date();

    const formatter = new Intl.DateTimeFormat("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Argentina/Cordoba",
    });

    const parts = formatter.formatToParts(now);
    const get = (type: Intl.DateTimeFormatPartTypes): string =>
      parts.find((p) => p.type === type)?.value ?? "";

    const capitalize = (value: string): string =>
      value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : value;

    const weekday = capitalize(get("weekday"));
    const day = get("day");
    const month = capitalize(get("month"));
    const year = get("year");
    const hour = get("hour").padStart(2, "0");
    const minute = get("minute").padStart(2, "0");

    const rawPeriod = get("dayPeriod").toLowerCase();
    const period = rawPeriod.includes("p") ? "PM" : "AM";

    return `${weekday}, ${day} De ${month} De ${year}, ${hour}:${minute}HS ${period}`;
  },
};
