import { chatLogger } from "./chatLogger.js";

export async function showChatStats(): Promise<void> {
  const stats = await chatLogger.getLogFileStats();
  
  console.log("\n=== ESTADÍSTICAS DEL ARCHIVO DE CHAT ===");
  console.log(`Archivo: ${stats.exists ? "Existe" : "No existe"}`);
  console.log(`Tamaño: ${stats.sizeMB} MB (${stats.size} bytes)`);
  console.log(`Límite: 10240 MB (10GB)`);
  
  if (stats.exists) {
    const percentage = (stats.sizeMB / 10240) * 100;
    console.log(`Uso: ${percentage.toFixed(2)}%`);
    
    if (percentage > 80) {
      console.log("⚠️  ADVERTENCIA: El archivo está cerca del límite de 10GB");
    }
  }
  
  console.log("========================================\n");
}