"use client";

import { ScheduleEntry } from '@/types/schedule';
import { useMemo } from 'react';

interface UpcomingDaysCalendarProps {
  entries: ScheduleEntry[];
}

export function UpcomingDaysCalendar({ entries }: UpcomingDaysCalendarProps) {
  // Group entries by date
  const dayGroups = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Filter future entries
    const futureEntries = entries.filter(entry => {
      const [year, month, dayNum] = entry.date.split('-').map(Number);
      const entryDate = new Date(year, month - 1, dayNum);
      return entryDate >= today;
    });

    // Group by date
    const groups = futureEntries.reduce((acc, entry) => {
      if (!acc[entry.date]) {
        acc[entry.date] = {
          date: entry.date,
          dayName: entry.day,
          entries: [],
        };
      }
      acc[entry.date].entries.push(entry);
      return acc;
    }, {} as Record<string, { date: string; dayName: string; entries: ScheduleEntry[] }>);

    // Convert to array and sort by date
    return Object.values(groups)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 10); // Limit to next 10 days
  }, [entries]);

  if (dayGroups.length === 0) {
    return null;
  }

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return `${day}.${month}.${year}`;
  };

  const getTimeUntil = (dateStr: string): string => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Dziś';
    if (diffDays === 1) return 'Jutro';
    if (diffDays < 7) return `za ${diffDays} dni`;

    const weeks = Math.floor(diffDays / 7);
    const remainingDays = diffDays % 7;

    if (remainingDays === 0) {
      return weeks === 1 ? 'za 1 tydzień' : `za ${weeks} tygodnie`;
    }

    if (weeks === 1) {
      return `za 1 tydzień i ${remainingDays} ${remainingDays === 1 ? 'dzień' : 'dni'}`;
    }

    return `za ${weeks} tygodnie i ${remainingDays} ${remainingDays === 1 ? 'dzień' : 'dni'}`;
  };

  const getTimeRange = (entries: ScheduleEntry[]): string => {
    if (entries.length === 0) return '';

    // Sort by start time
    const sorted = [...entries].sort((a, b) => a.start_time.localeCompare(b.start_time));

    const firstStart = sorted[0].start_time;
    const lastEnd = sorted[sorted.length - 1].end_time;

    return `(${firstStart}-${lastEnd})`;
  };

  return (
    <div className="bg-white border border-gray-200 p-4">
      <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-3">
        Kalendarz zajęć
      </h2>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {dayGroups.map((day) => (
          <div
            key={day.date}
            className="border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-900">{formatDate(day.date)}</span>
                <span className="text-xs text-gray-500">{getTimeRange(day.entries)}</span>
                <span className="text-xs text-blue-600">• {getTimeUntil(day.date)}</span>
              </div>
              <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 border border-blue-200">
                {day.entries.length} {day.entries.length === 1 ? 'zajęcia' : 'zajęć'}
              </span>
            </div>

            <div className="space-y-1">
              {day.entries.map((entry, idx) => (
                <div key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                  <span className="font-mono text-gray-500">{entry.start_time}</span>
                  <span className="text-gray-900">{entry.class_info.subject}</span>
                  {entry.class_info.type && (
                    <span className="text-gray-500">({entry.class_info.type})</span>
                  )}
                  {entry.class_info.is_remote ? (
                    <span className="text-purple-600">• Zdalne</span>
                  ) : entry.class_info.room ? (
                    <span className="text-gray-500">• {entry.class_info.room}</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
