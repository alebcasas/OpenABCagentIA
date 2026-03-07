import fs from "fs/promises";
import path from "path";

const CHAT_LOG_FILE = "chat_log.txt";
const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024; // 10GB in bytes

export interface ChatEntry {
  timestamp: string;
  telegramUserId: number;
  role: string;
  content: string;
}

export class ChatLogger {
  private logFile: string;

  constructor() {
    this.logFile = path.join(process.cwd(), CHAT_LOG_FILE);
  }

  private async getFileSize(): Promise<number> {
    try {
      const stats = await fs.stat(this.logFile);
      return stats.size;
    } catch {
      return 0;
    }
  }

  private async checkAndClearFile(): Promise<void> {
    const currentSize = await this.getFileSize();
    if (currentSize >= MAX_FILE_SIZE) {
      console.log("Archivo de chat alcanzó el límite de 10GB. Limpiando...");
      await fs.writeFile(this.logFile, "");
      console.log("Archivo de chat limpiado exitosamente.");
    }
  }

  private formatEntry(entry: ChatEntry): string {
    return `[${entry.timestamp}] User: ${entry.telegramUserId} | Role: ${entry.role}\n${entry.content}\n---\n`;
  }

  async logChat(telegramUserId: number, role: string, content: string): Promise<void> {
    await this.checkAndClearFile();
    
    const entry: ChatEntry = {
      timestamp: new Date().toISOString(),
      telegramUserId,
      role,
      content
    };

    const logEntry = this.formatEntry(entry);
    await fs.appendFile(this.logFile, logEntry, 'utf8');
  }

  async getLogFileStats(): Promise<{ size: number; sizeMB: number; exists: boolean }> {
    try {
      const stats = await fs.stat(this.logFile);
      return {
        size: stats.size,
        sizeMB: Math.round(stats.size / (1024 * 1024)),
        exists: true
      };
    } catch {
      return {
        size: 0,
        sizeMB: 0,
        exists: false
      };
    }
  }
}

export const chatLogger = new ChatLogger();