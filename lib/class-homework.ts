import { turso } from './turso';

export type HomeworkPriority = 'low' | 'medium' | 'high';

export interface ClassHomework {
  id: number;
  user_id: string;
  entry_date: string;
  entry_time: string;
  subject: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: HomeworkPriority;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all homework for a specific class entry
 */
export async function getClassHomework(
  userId: string,
  date: string,
  time: string,
  subject: string
): Promise<ClassHomework[]> {
  const result = await turso.execute({
    sql: `SELECT * FROM class_homework WHERE user_id = ? AND entry_date = ? AND entry_time = ? AND subject = ? ORDER BY due_date ASC, priority DESC`,
    args: [userId, date, time, subject],
  });

  return result.rows.map((row) => ({
    id: row.id as number,
    user_id: row.user_id as string,
    entry_date: row.entry_date as string,
    entry_time: row.entry_time as string,
    subject: row.subject as string,
    title: row.title as string,
    description: (row.description as string) || null,
    due_date: (row.due_date as string) || null,
    priority: (row.priority as HomeworkPriority) || 'medium',
    completed: (row.completed as number) === 1,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }));
}

/**
 * Get all homework for a user
 */
export async function getUserHomework(userId: string, onlyIncomplete: boolean = false): Promise<ClassHomework[]> {
  let sql = `SELECT * FROM class_homework WHERE user_id = ?`;
  if (onlyIncomplete) {
    sql += ` AND completed = 0`;
  }
  sql += ` ORDER BY due_date ASC, priority DESC`;

  const result = await turso.execute({
    sql,
    args: [userId],
  });

  return result.rows.map((row) => ({
    id: row.id as number,
    user_id: row.user_id as string,
    entry_date: row.entry_date as string,
    entry_time: row.entry_time as string,
    subject: row.subject as string,
    title: row.title as string,
    description: (row.description as string) || null,
    due_date: (row.due_date as string) || null,
    priority: (row.priority as HomeworkPriority) || 'medium',
    completed: (row.completed as number) === 1,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }));
}

/**
 * Get homework by due date range
 */
export async function getHomeworkByDueDate(
  userId: string,
  startDate: string,
  endDate: string
): Promise<ClassHomework[]> {
  const result = await turso.execute({
    sql: `SELECT * FROM class_homework WHERE user_id = ? AND due_date >= ? AND due_date <= ? ORDER BY due_date ASC, priority DESC`,
    args: [userId, startDate, endDate],
  });

  return result.rows.map((row) => ({
    id: row.id as number,
    user_id: row.user_id as string,
    entry_date: row.entry_date as string,
    entry_time: row.entry_time as string,
    subject: row.subject as string,
    title: row.title as string,
    description: (row.description as string) || null,
    due_date: (row.due_date as string) || null,
    priority: (row.priority as HomeworkPriority) || 'medium',
    completed: (row.completed as number) === 1,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }));
}

/**
 * Create a new homework
 */
export async function createHomework(
  userId: string,
  date: string,
  time: string,
  subject: string,
  title: string,
  description: string | null = null,
  dueDate: string | null = null,
  priority: HomeworkPriority = 'medium'
): Promise<ClassHomework> {
  const result = await turso.execute({
    sql: `INSERT INTO class_homework (user_id, entry_date, entry_time, subject, title, description, due_date, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [userId, date, time, subject, title, description, dueDate, priority],
  });

  const now = new Date().toISOString();
  return {
    id: result.lastInsertRowid as number,
    user_id: userId,
    entry_date: date,
    entry_time: time,
    subject,
    title,
    description,
    due_date: dueDate,
    priority,
    completed: false,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Update homework
 */
export async function updateHomework(
  userId: string,
  homeworkId: number,
  updates: Partial<{
    title: string;
    description: string | null;
    due_date: string | null;
    priority: HomeworkPriority;
    completed: boolean;
  }>
): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  if (updates.due_date !== undefined) {
    fields.push('due_date = ?');
    values.push(updates.due_date);
  }
  if (updates.priority !== undefined) {
    fields.push('priority = ?');
    values.push(updates.priority);
  }
  if (updates.completed !== undefined) {
    fields.push('completed = ?');
    values.push(updates.completed ? 1 : 0);
  }

  if (fields.length === 0) return;

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(userId, homeworkId);

  await turso.execute({
    sql: `UPDATE class_homework SET ${fields.join(', ')} WHERE user_id = ? AND id = ?`,
    args: values,
  });
}

/**
 * Delete homework
 */
export async function deleteHomework(userId: string, homeworkId: number): Promise<void> {
  await turso.execute({
    sql: `DELETE FROM class_homework WHERE user_id = ? AND id = ?`,
    args: [userId, homeworkId],
  });
}

/**
 * Mark homework as completed
 */
export async function toggleHomeworkCompleted(userId: string, homeworkId: number): Promise<void> {
  await turso.execute({
    sql: `UPDATE class_homework SET completed = CASE WHEN completed = 1 THEN 0 ELSE 1 END, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND id = ?`,
    args: [userId, homeworkId],
  });
}
