import { ScheduleEntry } from '@/types/schedule';

/**
 * Generate ICS (iCalendar) file content from schedule entries
 */
export function generateICS(entries: ScheduleEntry[], filename = 'plan_zajec_pk.ics'): void {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Plan Zajęć PK//kiedy.app//PL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Plan Zajęć PK',
    'X-WR-TIMEZONE:Europe/Warsaw',
  ].join('\r\n');

  entries.forEach((entry) => {
    const [year, month, day] = entry.date.split('-').map(Number);
    const [startHour, startMin] = entry.start_time.split(':').map(Number);
    const [endHour, endMin] = entry.end_time.split(':').map(Number);

    const startDate = new Date(year, month - 1, day, startHour, startMin);
    const endDate = new Date(year, month - 1, day, endHour, endMin);

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const uid = `${entry.id}@kiedy.app`;
    const summary = `${entry.class_info.subject} (${entry.class_info.type || 'Zajęcia'})`;

    let description = `Grupa: ${entry.group}\\n`;
    if (entry.class_info.instructor) {
      description += `Prowadzący: ${entry.class_info.instructor}\\n`;
    }
    description += `Rok: ${entry.rok}, Semestr: ${entry.semestr}\\n`;
    description += `Kierunek: ${entry.kierunek}, ${entry.stopien} stopień\\n`;

    const location = entry.class_info.is_remote
      ? 'Zajęcia zdalne'
      : (entry.class_info.room || 'Nie określono');

    icsContent += '\r\n' + [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      `STATUS:CONFIRMED`,
      `SEQUENCE:0`,
      'END:VEVENT',
    ].join('\r\n');
  });

  icsContent += '\r\nEND:VCALENDAR';

  // Download the file
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * Generate ICS for a single entry
 */
export function exportSingleEntry(entry: ScheduleEntry): void {
  const filename = `${entry.class_info.subject.replace(/\s+/g, '_')}_${entry.date}.ics`;
  generateICS([entry], filename);
}

/**
 * Generate ICS for all filtered entries
 */
export function exportAllEntries(entries: ScheduleEntry[]): void {
  generateICS(entries, 'plan_zajec_pk_wszystko.ics');
}
