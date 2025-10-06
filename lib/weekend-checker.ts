import { ScheduleEntry } from '@/types/schedule';

export interface WeekendInfo {
  hasClasses: boolean;
  weekendStart: string; // ISO date string
  weekendEnd: string;   // ISO date string
  saturdayClasses: ScheduleEntry[];
  sundayClasses: ScheduleEntry[];
  stationaryCount: number;
}

/**
 * Check if there are classes in the upcoming weekend
 */
export function checkUpcomingWeekend(entries: ScheduleEntry[]): WeekendInfo {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

  // Calculate next Saturday
  let daysUntilSaturday = 6 - dayOfWeek;
  if (daysUntilSaturday <= 0) daysUntilSaturday += 7; // If today is Saturday or Sunday, get next weekend

  const nextSaturday = new Date(today);
  nextSaturday.setDate(today.getDate() + daysUntilSaturday);
  nextSaturday.setHours(0, 0, 0, 0);

  const nextSunday = new Date(nextSaturday);
  nextSunday.setDate(nextSaturday.getDate() + 1);

  // Format dates using local timezone (not UTC)
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const saturdayStr = formatLocalDate(nextSaturday);
  const sundayStr = formatLocalDate(nextSunday);

  const saturdayClasses = entries.filter(e => e.date === saturdayStr);
  const sundayClasses = entries.filter(e => e.date === sundayStr);

  const stationaryCount = [
    ...saturdayClasses.filter(e => !e.class_info.is_remote),
    ...sundayClasses.filter(e => !e.class_info.is_remote),
  ].length;

  return {
    hasClasses: saturdayClasses.length > 0 || sundayClasses.length > 0,
    weekendStart: saturdayStr,
    weekendEnd: sundayStr,
    saturdayClasses,
    sundayClasses,
    stationaryCount,
  };
}

/**
 * Format weekend date range for display
 */
export function formatWeekendDate(weekendStart: string, weekendEnd: string): string {
  const [yearStart, monthStart, dayStart] = weekendStart.split('-').map(Number);
  const [yearEnd, monthEnd, dayEnd] = weekendEnd.split('-').map(Number);

  return `${dayStart}.${monthStart} - ${dayEnd}.${monthEnd}`;
}
