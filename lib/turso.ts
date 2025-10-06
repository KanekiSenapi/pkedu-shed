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

  // Table for tracking schedule changes/diffs
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS schedule_changes (
      id TEXT PRIMARY KEY,
      old_schedule_id TEXT,
      new_schedule_id TEXT NOT NULL,
      change_type TEXT NOT NULL,
      entry_id TEXT,
      field_name TEXT,
      old_value TEXT,
      new_value TEXT,
      date TEXT,
      "group" TEXT,
      subject TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (old_schedule_id) REFERENCES schedules(id) ON DELETE SET NULL,
      FOREIGN KEY (new_schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
    )
  `);

  await turso.execute(`
    CREATE INDEX IF NOT EXISTS idx_changes_schedules ON schedule_changes(old_schedule_id, new_schedule_id)
  `);

  await turso.execute(`
    CREATE INDEX IF NOT EXISTS idx_changes_type ON schedule_changes(change_type)
  `);

  // Notifications table
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await turso.execute(`
    CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC)
  `);

  // Bug reports table
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS bug_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      url TEXT,
      user_info TEXT,
      contact_email TEXT,
      user_agent TEXT,
      status TEXT DEFAULT 'open',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await turso.execute(`
    CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status)
  `);

  await turso.execute(`
    CREATE INDEX IF NOT EXISTS idx_bug_reports_created ON bug_reports(created_at DESC)
  `);

  // Users table
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      google_id TEXT UNIQUE,
      name TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await turso.execute(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
  `);

  await turso.execute(`
    CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)
  `);

  // User preferences table
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      preferences_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await turso.execute(`
    CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id)
  `);
}
