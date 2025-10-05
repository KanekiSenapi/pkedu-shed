import { turso, initDatabase } from './turso';
import { ParsedSchedule, ScheduleEntry } from '@/types/schedule';

/**
 * Save schedule to Turso database
 */
export async function saveScheduleToDB(schedule: ParsedSchedule): Promise<void> {
  // Ensure tables exist
  await initDatabase();

  // Delete old schedule with same hash
  await turso.execute({
    sql: 'DELETE FROM schedules WHERE file_hash = ?',
    args: [schedule.fileHash],
  });

  // Insert new schedule
  const scheduleId = `schedule_${Date.now()}`;
  await turso.execute({
    sql: 'INSERT INTO schedules (id, file_hash, last_updated) VALUES (?, ?, ?)',
    args: [scheduleId, schedule.fileHash, schedule.lastUpdated],
  });

  // Insert all entries
  for (const section of schedule.sections) {
    for (const entry of section.entries) {
      await turso.execute({
        sql: `INSERT INTO schedule_entries (
          id, schedule_id, date, day, time, start_time, end_time, "group",
          subject, type, instructor, room, is_remote, raw_content,
          kierunek, stopien, rok, semestr, tryb
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          entry.id,
          scheduleId,
          entry.date,
          entry.day,
          entry.time,
          entry.start_time,
          entry.end_time,
          entry.group,
          entry.class_info.subject,
          entry.class_info.type || null,
          entry.class_info.instructor || null,
          entry.class_info.room || null,
          entry.class_info.is_remote ? 1 : 0,
          entry.class_info.raw,
          entry.kierunek,
          entry.stopien,
          entry.rok,
          entry.semestr,
          entry.tryb,
        ],
      });
    }
  }
}

/**
 * Load schedule from database
 */
export async function loadScheduleFromDB(): Promise<ParsedSchedule | null> {
  try {
    await initDatabase();

    // Get latest schedule
    const scheduleResult = await turso.execute({
      sql: 'SELECT * FROM schedules ORDER BY created_at DESC LIMIT 1',
      args: [],
    });

    if (scheduleResult.rows.length === 0) {
      return null;
    }

    const scheduleRow = scheduleResult.rows[0];
    const scheduleId = scheduleRow.id as string;

    // Get all entries
    const entriesResult = await turso.execute({
      sql: 'SELECT * FROM schedule_entries WHERE schedule_id = ?',
      args: [scheduleId],
    });

    // Group entries by section
    const sectionsMap = new Map<string, ScheduleEntry[]>();

    for (const row of entriesResult.rows) {
      const entry: ScheduleEntry = {
        id: row.id as string,
        date: row.date as string,
        day: row.day as any,
        time: row.time as string,
        start_time: row.start_time as string,
        end_time: row.end_time as string,
        group: row.group as string,
        class_info: {
          subject: row.subject as string,
          type: row.type as any,
          instructor: row.instructor as string | null,
          room: row.room as string | null,
          is_remote: row.is_remote === 1,
          raw: row.raw_content as string,
        },
        kierunek: row.kierunek as string,
        stopien: row.stopien as string,
        rok: row.rok as number,
        semestr: row.semestr as number,
        tryb: row.tryb as any,
      };

      const sectionKey = `${row.kierunek}_${row.stopien}_${row.rok}_${row.semestr}_${row.tryb}`;

      if (!sectionsMap.has(sectionKey)) {
        sectionsMap.set(sectionKey, []);
      }
      sectionsMap.get(sectionKey)!.push(entry);
    }

    // Build sections
    const sections = Array.from(sectionsMap.entries()).map(([key, entries]) => {
      const first = entries[0];
      const groups = Array.from(new Set(entries.map(e => e.group))).sort();

      return {
        kierunek: first.kierunek,
        stopien: first.stopien,
        rok: first.rok,
        semestr: first.semestr,
        tryb: first.tryb,
        groups,
        entries,
      };
    });

    return {
      sections,
      lastUpdated: scheduleRow.last_updated as string,
      fileHash: scheduleRow.file_hash as string,
    };
  } catch (error) {
    console.error('Error loading schedule from DB:', error);
    return null;
  }
}

/**
 * Get latest schedule hash
 */
export async function getLatestScheduleHash(): Promise<string | null> {
  try {
    await initDatabase();

    const result = await turso.execute({
      sql: 'SELECT file_hash FROM schedules ORDER BY created_at DESC LIMIT 1',
      args: [],
    });

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].file_hash as string;
  } catch (error) {
    console.error('Error getting latest hash:', error);
    return null;
  }
}

/**
 * Clear all data from database
 */
export async function clearDatabase(): Promise<void> {
  await initDatabase();
  await turso.execute('DELETE FROM schedule_entries');
  await turso.execute('DELETE FROM schedules');
}
