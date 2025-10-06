import { ParsedSchedule, ScheduleEntry } from '@/types/schedule';
import { UserPreferences } from './user-preferences';

/**
 * Filter schedule entries based on user preferences
 */
export function filterScheduleByPreferences(
  schedule: ParsedSchedule | null,
  preferences: UserPreferences | null
): ScheduleEntry[] {
  if (!schedule || !preferences) return [];

  const allEntries = schedule.sections.flatMap(s => s.entries);

  if (preferences.role === 'student') {
    return allEntries.filter(
      entry =>
        entry.stopien === preferences.stopien &&
        entry.rok === preferences.rok &&
        preferences.groups.some(group => entry.group.includes(group))
    );
  }

  if (preferences.role === 'instructor') {
    return allEntries.filter(
      entry => entry.class_info.instructor === preferences.fullName
    );
  }

  return [];
}

/**
 * Get today's classes
 */
export function getTodayClasses(entries: ScheduleEntry[]): ScheduleEntry[] {
  const today = new Date().toISOString().split('T')[0];
  return entries
    .filter(e => e.date === today)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
}

/**
 * Get upcoming classes (next 7 days)
 */
export function getUpcomingClasses(entries: ScheduleEntry[]): ScheduleEntry[] {
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  const todayStr = today.toISOString().split('T')[0];
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  return entries
    .filter(e => e.date >= todayStr && e.date <= nextWeekStr)
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.start_time.localeCompare(b.start_time);
    })
    .slice(0, 10); // Limit to 10 entries
}

/**
 * Get stats for dashboard
 */
export function getDashboardStats(entries: ScheduleEntry[]) {
  const today = getTodayClasses(entries);
  const upcoming = getUpcomingClasses(entries);

  const thisWeek = upcoming.filter(e => {
    const entryDate = new Date(e.date);
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    return entryDate >= weekStart && entryDate <= weekEnd;
  });

  return {
    todayCount: today.length,
    thisWeekCount: thisWeek.length,
    remoteCount: thisWeek.filter(e => e.class_info.is_remote).length,
    stationaryCount: thisWeek.filter(e => !e.class_info.is_remote).length,
  };
}
