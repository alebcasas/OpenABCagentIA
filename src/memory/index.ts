import Database from "better-sqlite3";
import { loadEnv } from "../config/env.js";
import { chatLogger } from "./chatLogger.js";

export interface ConversationRow {
  id: number;
  telegram_user_id: number;
  role: string;
  content: string;
  created_at: string;
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_user_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_user_created ON conversations(telegram_user_id, created_at);
`;

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    const env = loadEnv();
    db = new Database(env.DB_PATH);
    db.exec(SCHEMA_SQL);
  }
  return db;
}

export const MemoryStore = {
  add(telegramUserId: number, role: string, content: string): void {
    const database = getDb();
    database
      .prepare(
        "INSERT INTO conversations (telegram_user_id, role, content) VALUES (?, ?, ?)"
      )
      .run(telegramUserId, role, content);
    
    // Registrar en el archivo de chat
    chatLogger.logChat(telegramUserId, role, content).catch(console.error);
  },

  getRecent(telegramUserId: number, limit: number): ConversationRow[] {
    const database = getDb();
    const rows = database
      .prepare(
        "SELECT id, telegram_user_id, role, content, created_at FROM conversations WHERE telegram_user_id = ? ORDER BY created_at DESC LIMIT ?"
      )
      .all(telegramUserId, limit) as ConversationRow[];
    return rows.reverse();
  },

  trimOld(telegramUserId: number, keepLast: number): void {
    const database = getDb();
    const rows = database
      .prepare(
        "SELECT id FROM conversations WHERE telegram_user_id = ? ORDER BY created_at DESC LIMIT ?"
      )
      .all(telegramUserId, keepLast) as { id: number }[];
    if (rows.length < keepLast) return;
    const minId = Math.min(...rows.map((r) => r.id));
    database
      .prepare("DELETE FROM conversations WHERE telegram_user_id = ? AND id < ?")
      .run(telegramUserId, minId);
  },
};
