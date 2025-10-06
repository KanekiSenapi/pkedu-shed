import { turso } from './turso';

export interface DbNotification {
  id: number;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  created_at: string;
}

/**
 * Get all notifications (ordered by newest first)
 */
export async function getNotifications(limit = 50): Promise<DbNotification[]> {
  const db = turso;

  const result = await db.execute({
    sql: 'SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?',
    args: [limit],
  });

  return result.rows.map(row => ({
    id: row.id as number,
    type: row.type as DbNotification['type'],
    title: row.title as string,
    message: row.message as string,
    created_at: row.created_at as string,
  }));
}

/**
 * Add a new notification
 */
export async function addNotification(
  type: DbNotification['type'],
  title: string,
  message: string
): Promise<DbNotification> {
  const db = turso;

  const result = await db.execute({
    sql: 'INSERT INTO notifications (type, title, message) VALUES (?, ?, ?) RETURNING *',
    args: [type, title, message],
  });

  const row = result.rows[0];

  return {
    id: row.id as number,
    type: row.type as DbNotification['type'],
    title: row.title as string,
    message: row.message as string,
    created_at: row.created_at as string,
  };
}

/**
 * Delete old notifications (keep last N)
 */
export async function cleanupOldNotifications(keepLast = 100) {
  const db = turso;

  await db.execute({
    sql: `
      DELETE FROM notifications
      WHERE id NOT IN (
        SELECT id FROM notifications
        ORDER BY created_at DESC
        LIMIT ?
      )
    `,
    args: [keepLast],
  });
}
