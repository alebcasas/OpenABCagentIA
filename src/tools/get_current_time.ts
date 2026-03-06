export const get_current_time = {
  name: "get_current_time",
  description:
    "Obtiene la fecha y hora actual en la zona horaria del servidor (ISO 8601).",
  execute: async (): Promise<string> => {
    const now = new Date();
    return now.toISOString();
  },
};
