import { createClient } from '@libsql/client';

// Use local database in development if Turso credentials are not set
const isDev = process.env.NODE_ENV !== 'production';
const hasTursoConfig = process.env.TURSO_DATABASE_URL && process.env.TURSO_DATABASE_URL.trim() !== '';

export const turso = createClient(
  hasTursoConfig
    ? {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }
    : {
        url: 'file:./data/local.db',
      }
);

// Initialize database schema
export async function initDatabase() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      file_hash TEXT UNIQUE NOT NULL,
      file_name TEXT,
      last_updated TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS schedule_entries (
      id TEXT PRIMARY KEY,
      schedule_id TEXT NOT NULL,
      date TEXT NOT NULL,
      day TEXT NOT NULL,
      time TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      "group" TEXT NOT NULL,
      subject TEXT NOT NULL,
      type TEXT,
      instructor TEXT,
      room TEXT,
      is_remote INTEGER DEFAULT 0,
      raw_content TEXT NOT NULL,
      kierunek TEXT NOT NULL,
      stopien TEXT NOT NULL,
      rok INTEGER NOT NULL,
      semestr INTEGER NOT NULL,
      tryb TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
    )
  `);

  await turso.execute(`
    CREATE INDEX IF NOT EXISTS idx_entries_schedule ON schedule_entries(schedule_id)
  `);

  await turso.execute(`
    CREATE INDEX IF NOT EXISTS idx_entries_date_group ON schedule_entries(date, "group")
  `);

  await turso.execute(`
    CREATE INDEX IF NOT EXISTS idx_entries_filters ON schedule_entries(kierunek, stopien, rok, semestr)
  `);
}
