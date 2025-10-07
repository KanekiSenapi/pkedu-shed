import { turso } from './turso';

export interface ClassAttendance {
  id: number;
  user_id: string;
  entry_date: string;
  entry_time: string;
  subject: string;
  attended: boolean;
  created_at: string;
}

export interface AttendanceStats {
  total_classes: number;
  attended: number;
  missed: number;
  attendance_rate: number;
  total_hours: number;
  attended_hours: number;
}

/**
 * Get attendance for a specific class entry
 */
export async function getClassAttendance(
  userId: string,
  date: string,
  time: string,
  subject: string
): Promise<ClassAttendance | null> {
  const result = await turso.execute({
    sql: `SELECT * FROM class_attendance WHERE user_id = ? AND entry_date = ? AND entry_time = ? AND subject = ?`,
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
    attended: (row.attended as number) === 1,
    created_at: row.created_at as string,
  };
}

/**
 * Get all attendance records for a user
 */
export async function getUserAttendance(userId: string): Promise<ClassAttendance[]> {
  const result = await turso.execute({
    sql: `SELECT * FROM class_attendance WHERE user_id = ? ORDER BY entry_date DESC, entry_time DESC`,
    args: [userId],
  });

  return result.rows.map((row) => ({
    id: row.id as number,
    user_id: row.user_id as string,
    entry_date: row.entry_date as string,
    entry_time: row.entry_time as string,
    subject: row.subject as string,
    attended: (row.attended as number) === 1,
    created_at: row.created_at as string,
  }));
}

/**
 * Get attendance for a specific date range
 */
export async function getAttendanceForDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<ClassAttendance[]> {
  const result = await turso.execute({
    sql: `SELECT * FROM class_attendance WHERE user_id = ? AND entry_date >= ? AND entry_date <= ? ORDER BY entry_date DESC, entry_time DESC`,
    args: [userId, startDate, endDate],
  });

  return result.rows.map((row) => ({
    id: row.id as number,
    user_id: row.user_id as string,
    entry_date: row.entry_date as string,
    entry_time: row.entry_time as string,
    subject: row.subject as string,
    attended: (row.attended as number) === 1,
    created_at: row.created_at as string,
  }));
}

/**
 * Mark attendance for a class
 */
export async function markAttendance(
  userId: string,
  date: string,
  time: string,
  subject: string,
  attended: boolean
): Promise<ClassAttendance> {
  // Check if attendance already exists
  const existing = await getClassAttendance(userId, date, time, subject);

  if (existing) {
    // Update existing attendance
    await turso.execute({
      sql: `UPDATE class_attendance SET attended = ? WHERE id = ?`,
      args: [attended ? 1 : 0, existing.id],
    });

    return {
      ...existing,
      attended,
    };
  } else {
    // Create new attendance record
    const result = await turso.execute({
      sql: `INSERT INTO class_attendance (user_id, entry_date, entry_time, subject, attended) VALUES (?, ?, ?, ?, ?)`,
      args: [userId, date, time, subject, attended ? 1 : 0],
    });

    return {
      id: Number(result.lastInsertRowid),
      user_id: userId,
      entry_date: date,
      entry_time: time,
      subject,
      attended,
      created_at: new Date().toISOString(),
    };
  }
}

/**
 * Calculate attendance statistics for a user
 */
export async function getAttendanceStats(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<AttendanceStats> {
  let sql = `SELECT attended, entry_time FROM class_attendance WHERE user_id = ?`;
  const args: any[] = [userId];

  if (startDate && endDate) {
    sql += ` AND entry_date >= ? AND entry_date <= ?`;
    args.push(startDate, endDate);
  }

  const result = await turso.execute({ sql, args });

  if (result.rows.length === 0) {
    return {
      total_classes: 0,
      attended: 0,
      missed: 0,
      attendance_rate: 0,
      total_hours: 0,
      attended_hours: 0,
    };
  }

  let attended = 0;
  let totalHours = 0;
  let attendedHours = 0;

  for (const row of result.rows) {
    const wasAttended = (row.attended as number) === 1;
    if (wasAttended) {
      attended++;
    }

    // Calculate hours from time (assumes 1.5h per class)
    const classHours = 1.5;
    totalHours += classHours;
    if (wasAttended) {
      attendedHours += classHours;
    }
  }

  const total = result.rows.length;
  const missed = total - attended;
  const attendance_rate = total > 0 ? (attended / total) * 100 : 0;

  return {
    total_classes: total,
    attended,
    missed,
    attendance_rate,
    total_hours: totalHours,
    attended_hours: attendedHours,
  };
}

/**
 * Get attendance by subject
 */
export async function getAttendanceBySubject(userId: string): Promise<Map<string, AttendanceStats>> {
  const result = await turso.execute({
    sql: `SELECT subject, attended FROM class_attendance WHERE user_id = ?`,
    args: [userId],
  });

  const subjectMap = new Map<string, { attended: number; total: number }>();

  for (const row of result.rows) {
    const subject = row.subject as string;
    const wasAttended = (row.attended as number) === 1;

    if (!subjectMap.has(subject)) {
      subjectMap.set(subject, { attended: 0, total: 0 });
    }

    const stats = subjectMap.get(subject)!;
    stats.total++;
    if (wasAttended) {
      stats.attended++;
    }
  }

  const statsMap = new Map<string, AttendanceStats>();
  for (const [subject, { attended, total }] of subjectMap.entries()) {
    const missed = total - attended;
    const classHours = 1.5;
    statsMap.set(subject, {
      total_classes: total,
      attended,
      missed,
      attendance_rate: (attended / total) * 100,
      total_hours: total * classHours,
      attended_hours: attended * classHours,
    });
  }

  return statsMap;
}
