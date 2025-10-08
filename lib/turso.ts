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
      target_rok INTEGER,
      target_groups TEXT,
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
      is_admin INTEGER DEFAULT 0,
      role TEXT DEFAULT 'user',
      starosta_rok INTEGER,
      starosta_groups TEXT,
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

  // Instructors table - for managing instructor names and abbreviations
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS instructors (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      abbreviations TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await turso.execute(`
    CREATE INDEX IF NOT EXISTS idx_instructors_name ON instructors(full_name)
  `);

  // Subjects table - for managing subjects assigned to specific year/semester
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      abbreviations TEXT NOT NULL DEFAULT '[]',
      kierunek TEXT NOT NULL,
      stopien TEXT NOT NULL,
      rok INTEGER NOT NULL,
      semestr INTEGER NOT NULL,
      tryb TEXT NOT NULL DEFAULT 'stacjonarne',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await turso.execute(`
    CREATE INDEX IF NOT EXISTS idx_subjects_filters ON subjects(kierunek, stopien, rok, semestr, tryb)
  `);

  // Subject-Instructor relation table (many-to-many)
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS subject_instructors (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      instructor_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE
    )
  `);

  await turso.execute(`
    CREATE INDEX IF NOT EXISTS idx_subject_instructors_subject ON subject_instructors(subject_id)
  `);

  await turso.execute(`
    CREATE INDEX IF NOT EXISTS idx_subject_instructors_instructor ON subject_instructors(instructor_id)
  `);

  await turso.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_subject_instructor_unique ON subject_instructors(subject_id, instructor_id)
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

  // Migration: Add is_admin column if it doesn't exist
  try {
    await turso.execute(`
      ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0
    `);
  } catch (error) {
    // Column already exists, ignore error
  }

  // Migration: Add role columns
  try {
    await turso.execute(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`);
  } catch (error) {
    // Column already exists
  }

  try {
    await turso.execute(`ALTER TABLE users ADD COLUMN starosta_rok INTEGER`);
  } catch (error) {
    // Column already exists
  }

  try {
    await turso.execute(`ALTER TABLE users ADD COLUMN starosta_groups TEXT`);
  } catch (error) {
    // Column already exists
  }

  // Bug report notes table
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS bug_report_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      admin_id TEXT NOT NULL,
      note TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES bug_reports(id) ON DELETE CASCADE,
      FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await turso.execute(`
    CREATE INDEX IF NOT EXISTS idx_notes_report ON bug_report_notes(report_id)
  `);

  // Login logs table
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS login_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      login_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      user_agent TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await turso.execute(`
    CREATE INDEX IF NOT EXISTS idx_login_logs_user ON login_logs(user_id)
  `);

  await turso.execute(`
    CREATE INDEX IF NOT EXISTS idx_login_logs_date ON login_logs(login_at DESC)
  `);

  // Migration: Add target columns to notifications
  try {
    await turso.execute(`ALTER TABLE notifications ADD COLUMN target_rok INTEGER`);
  } catch (error) {
    // Column already exists
  }

  try {
    await turso.execute(`ALTER TABLE notifications ADD COLUMN target_groups TEXT`);
  } catch (error) {
    // Column already exists
  }

  // Migration: Add tryb column to subjects
  try {
    await turso.execute(`ALTER TABLE subjects ADD COLUMN tryb TEXT NOT NULL DEFAULT 'stacjonarne'`);
  } catch (error) {
    // Column already exists
  }

  // Migration: Add abbreviations column to subjects
  try {
    await turso.execute(`ALTER TABLE subjects ADD COLUMN abbreviations TEXT NOT NULL DEFAULT '[]'`);
  } catch (error) {
    // Column already exists
  }

  // Class notes table
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS class_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      entry_date TEXT NOT NULL,
      entry_time TEXT NOT NULL,
      subject TEXT NOT NULL,
      note TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await turso.execute(`
    CREATE INDEX IF NOT EXISTS idx_notes_user_date ON class_notes(user_id, entry_date)
  `);

  // Class attendance table
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS class_attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      entry_date TEXT NOT NULL,
      entry_time TEXT NOT NULL,
      subject TEXT NOT NULL,
      attended INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, entry_date, entry_time, subject)
    )
  `);

  await turso.execute(`
    CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON class_attendance(user_id, entry_date)
  `);

  await turso.execute(`
    CREATE INDEX IF NOT EXISTS idx_attendance_user ON class_attendance(user_id)
  `);

  // Class homework table
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS class_homework (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      entry_date TEXT NOT NULL,
      entry_time TEXT NOT NULL,
      subject TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT,
      priority TEXT DEFAULT 'medium',
      completed INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await turso.execute(`
    CREATE INDEX IF NOT EXISTS idx_homework_user_date ON class_homework(user_id, due_date)
  `);

  await turso.execute(`
    CREATE INDEX IF NOT EXISTS idx_homework_user_completed ON class_homework(user_id, completed)
  `);
}
