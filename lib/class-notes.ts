import { turso } from './turso';

export interface ClassNote {
  id: number;
  user_id: string;
  entry_date: string;
  entry_time: string;
  subject: string;
  note: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get note for a specific class entry
 */
export async function getClassNote(
  userId: string,
  date: string,
  time: string,
  subject: string
): Promise<ClassNote | null> {
  const result = await turso.execute({
    sql: `SELECT * FROM class_notes WHERE user_id = ? AND entry_date = ? AND entry_time = ? AND subject = ?`,
    args: [userId, date, time, subject],
  });

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id as number,
    user_id: row.user_id as string,
    entry_date: row.entry_date as string,
    entry_time: row.entry_time as string,
    subject: row.subject as string,
    note: row.note as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

/**
 * Get all notes for a user
 */
export async function getUserNotes(userId: string): Promise<ClassNote[]> {
  const result = await turso.execute({
    sql: `SELECT * FROM class_notes WHERE user_id = ? ORDER BY entry_date DESC, entry_time DESC`,
    args: [userId],
  });

  return result.rows.map((row) => ({
    id: row.id as number,
    user_id: row.user_id as string,
    entry_date: row.entry_date as string,
    entry_time: row.entry_time as string,
    subject: row.subject as string,
    note: row.note as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }));
}

/**
 * Get notes for a specific date range
 */
export async function getNotesForDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<ClassNote[]> {
  const result = await turso.execute({
    sql: `SELECT * FROM class_notes WHERE user_id = ? AND entry_date >= ? AND entry_date <= ? ORDER BY entry_date DESC, entry_time DESC`,
    args: [userId, startDate, endDate],
  });

  return result.rows.map((row) => ({
    id: row.id as number,
    user_id: row.user_id as string,
    entry_date: row.entry_date as string,
    entry_time: row.entry_time as string,
    subject: row.subject as string,
    note: row.note as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }));
}

/**
 * Save or update a note
 */
export async function saveClassNote(
  userId: string,
  date: string,
  time: string,
  subject: string,
  note: string
): Promise<ClassNote> {
  // Check if note already exists
  const existing = await getClassNote(userId, date, time, subject);

  if (existing) {
    // Update existing note
    await turso.execute({
      sql: `UPDATE class_notes SET note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [note, existing.id],
    });

    return {
      ...existing,
      note,
      updated_at: new Date().toISOString(),
    };
  } else {
    // Create new note
    const result = await turso.execute({
      sql: `INSERT INTO class_notes (user_id, entry_date, entry_time, subject, note) VALUES (?, ?, ?, ?, ?)`,
      args: [userId, date, time, subject, note],
    });

    const now = new Date().toISOString();
    return {
      id: result.lastInsertRowid as number,
      user_id: userId,
      entry_date: date,
      entry_time: time,
      subject,
      note,
      created_at: now,
      updated_at: now,
    };
  }
}

/**
 * Delete a note
 */
export async function deleteClassNote(userId: string, noteId: number): Promise<void> {
  await turso.execute({
    sql: `DELETE FROM class_notes WHERE id = ? AND user_id = ?`,
    args: [noteId, userId],
  });
}
