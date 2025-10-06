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

  const saturdayStr = nextSaturday.toISOString().split('T')[0];
  const sundayStr = nextSunday.toISOString().split('T')[0];

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
export function formatWeekendDate(weekendStart: string): string {
  const [year, month, day] = weekendStart.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);

  return `${day}.${month} - ${nextDay.getDate()}.${nextDay.getMonth() + 1}`;
}
