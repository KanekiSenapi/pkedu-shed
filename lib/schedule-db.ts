import { turso, initDatabase } from './turso';
import { ParsedSchedule, ScheduleEntry } from '@/types/schedule';

/**
 * Save schedule to Turso database
 */
export async function saveScheduleToDB(schedule: ParsedSchedule): Promise<void> {
  const start = Date.now();
  console.log('[DB] Starting database save...');

  // Ensure tables exist
  const initStart = Date.now();
  await initDatabase();
  console.log(`[DB] Database initialized in ${Date.now() - initStart}ms`);

  // Check if schedule with this hash already exists
  const checkStart = Date.now();
  const existingResult = await turso.execute({
    sql: 'SELECT id FROM schedules WHERE file_hash = ?',
    args: [schedule.fileHash],
  });
  console.log(`[DB] Hash check took ${Date.now() - checkStart}ms`);

  if (existingResult.rows.length > 0) {
    console.log('[DB] Schedule with this hash already exists, skipping save');
    return;
  }

  // Get previous schedule for comparison
  const prevStart = Date.now();
  const previousSchedule = await loadScheduleFromDB();
  console.log(`[DB] Previous schedule loaded in ${Date.now() - prevStart}ms`);

  // Insert new schedule
  const scheduleId = `schedule_${Date.now()}`;
  const scheduleInsertStart = Date.now();
  await turso.execute({
    sql: 'INSERT INTO schedules (id, file_hash, last_updated) VALUES (?, ?, ?)',
    args: [scheduleId, schedule.fileHash, schedule.lastUpdated],
  });
  console.log(`[DB] Schedule record inserted in ${Date.now() - scheduleInsertStart}ms`);

  // Insert all entries
  const entriesStart = Date.now();
  let totalEntries = 0;
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
      totalEntries++;
    }
  }
  console.log(`[DB] Inserted ${totalEntries} entries in ${Date.now() - entriesStart}ms`);

  // If there was a previous schedule, compute and save changes
  if (previousSchedule) {
    const changesStart = Date.now();
    const previousScheduleId = await getPreviousScheduleId();
    if (previousScheduleId) {
      await computeAndSaveChanges(previousSchedule, schedule, previousScheduleId, scheduleId);
    }
    console.log(`[DB] Changes computed in ${Date.now() - changesStart}ms`);
  }

  console.log(`[DB] Total save time: ${Date.now() - start}ms`);
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
  await turso.execute('DELETE FROM schedule_changes');
  await turso.execute('DELETE FROM schedule_entries');
  await turso.execute('DELETE FROM schedules');
}

/**
 * Get previous schedule ID (second most recent)
 */
async function getPreviousScheduleId(): Promise<string | null> {
  try {
    const result = await turso.execute({
      sql: 'SELECT id FROM schedules ORDER BY created_at DESC LIMIT 1 OFFSET 1',
      args: [],
    });

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].id as string;
  } catch (error) {
    console.error('Error getting previous schedule ID:', error);
    return null;
  }
}

/**
 * Compute and save changes between two schedules
 */
async function computeAndSaveChanges(
  oldSchedule: ParsedSchedule,
  newSchedule: ParsedSchedule,
  oldScheduleId: string,
  newScheduleId: string
): Promise<void> {
  console.log('Computing changes between schedules...');

  // Build maps for quick lookup
  const oldEntriesMap = new Map<string, ScheduleEntry>();
  const newEntriesMap = new Map<string, ScheduleEntry>();

  for (const section of oldSchedule.sections) {
    for (const entry of section.entries) {
      // Create a unique key based on date, time, and group (not entry.id which may change)
      const key = `${entry.date}_${entry.start_time}_${entry.end_time}_${entry.group}`;
      oldEntriesMap.set(key, entry);
    }
  }

  for (const section of newSchedule.sections) {
    for (const entry of section.entries) {
      const key = `${entry.date}_${entry.start_time}_${entry.end_time}_${entry.group}`;
      newEntriesMap.set(key, entry);
    }
  }

  let changesCount = 0;

  // Find added entries
  for (const [key, newEntry] of newEntriesMap) {
    if (!oldEntriesMap.has(key)) {
      const changeId = `change_${Date.now()}_${changesCount++}`;
      await turso.execute({
        sql: `INSERT INTO schedule_changes (
          id, old_schedule_id, new_schedule_id, change_type,
          entry_id, date, "group", subject
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          changeId,
          oldScheduleId,
          newScheduleId,
          'added',
          newEntry.id,
          newEntry.date,
          newEntry.group,
          newEntry.class_info.subject,
        ],
      });
    }
  }

  // Find removed entries
  for (const [key, oldEntry] of oldEntriesMap) {
    if (!newEntriesMap.has(key)) {
      const changeId = `change_${Date.now()}_${changesCount++}`;
      await turso.execute({
        sql: `INSERT INTO schedule_changes (
          id, old_schedule_id, new_schedule_id, change_type,
          entry_id, date, "group", subject
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          changeId,
          oldScheduleId,
          newScheduleId,
          'removed',
          oldEntry.id,
          oldEntry.date,
          oldEntry.group,
          oldEntry.class_info.subject,
        ],
      });
    }
  }

  // Find modified entries
  for (const [key, newEntry] of newEntriesMap) {
    const oldEntry = oldEntriesMap.get(key);
    if (oldEntry) {
      // Compare fields
      const fieldsToCompare = [
        { name: 'subject', oldVal: oldEntry.class_info.subject, newVal: newEntry.class_info.subject },
        { name: 'instructor', oldVal: oldEntry.class_info.instructor, newVal: newEntry.class_info.instructor },
        { name: 'room', oldVal: oldEntry.class_info.room, newVal: newEntry.class_info.room },
        { name: 'type', oldVal: oldEntry.class_info.type, newVal: newEntry.class_info.type },
        { name: 'is_remote', oldVal: String(oldEntry.class_info.is_remote), newVal: String(newEntry.class_info.is_remote) },
      ];

      for (const field of fieldsToCompare) {
        if (field.oldVal !== field.newVal) {
          const changeId = `change_${Date.now()}_${changesCount++}`;
          await turso.execute({
            sql: `INSERT INTO schedule_changes (
              id, old_schedule_id, new_schedule_id, change_type,
              entry_id, field_name, old_value, new_value,
              date, "group", subject
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              changeId,
              oldScheduleId,
              newScheduleId,
              'modified',
              newEntry.id,
              field.name,
              field.oldVal || null,
              field.newVal || null,
              newEntry.date,
              newEntry.group,
              newEntry.class_info.subject,
            ],
          });
        }
      }
    }
  }

  console.log(`Saved ${changesCount} changes to database`);
}

/**
 * Get all changes for a schedule
 */
export async function getScheduleChanges(scheduleId: string): Promise<any[]> {
  try {
    await initDatabase();

    const result = await turso.execute({
      sql: 'SELECT * FROM schedule_changes WHERE new_schedule_id = ? ORDER BY created_at ASC',
      args: [scheduleId],
    });

    return result.rows.map(row => ({
      id: row.id,
      changeType: row.change_type,
      fieldName: row.field_name,
      oldValue: row.old_value,
      newValue: row.new_value,
      date: row.date,
      group: row.group,
      subject: row.subject,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error('Error getting schedule changes:', error);
    return [];
  }
}

/**
 * Get summary of latest changes
 */
export async function getLatestChangesSummary(): Promise<{
  added: number;
  removed: number;
  modified: number;
  changes: any[];
}> {
  try {
    await initDatabase();

    // Get latest schedule
    const scheduleResult = await turso.execute({
      sql: 'SELECT id FROM schedules ORDER BY created_at DESC LIMIT 1',
      args: [],
    });

    if (scheduleResult.rows.length === 0) {
      return { added: 0, removed: 0, modified: 0, changes: [] };
    }

    const latestScheduleId = scheduleResult.rows[0].id as string;
    const changes = await getScheduleChanges(latestScheduleId);

    const added = changes.filter(c => c.changeType === 'added').length;
    const removed = changes.filter(c => c.changeType === 'removed').length;
    const modified = changes.filter(c => c.changeType === 'modified').length;

    return { added, removed, modified, changes };
  } catch (error) {
    console.error('Error getting changes summary:', error);
    return { added: 0, removed: 0, modified: 0, changes: [] };
  }
}
