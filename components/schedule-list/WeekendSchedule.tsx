"use client";

import { useMemo } from 'react';
import { useScheduleStore } from '@/lib/store';
import { ScheduleEntry } from '@/types/schedule';

export function WeekendSchedule() {
  const { getWeekendEntries } = useScheduleStore();
  const weekendEntries = getWeekendEntries();

  // Group entries by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, ScheduleEntry[]> = {};

    weekendEntries.forEach((entry) => {
      if (!groups[entry.date]) {
        groups[entry.date] = [];
      }
      groups[entry.date].push(entry);
    });

    // Sort each group by start time
    Object.keys(groups).forEach((date) => {
      groups[date].sort((a, b) => {
        return a.start_time.localeCompare(b.start_time);
      });
    });

    return groups;
  }, [weekendEntries]);

  // Get sorted dates
  const sortedDates = useMemo(() => {
    return Object.keys(groupedByDate).sort();
  }, [groupedByDate]);

  const getTypeColor = (type: string | null) => {
    switch (type) {
      case 'wykład':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'laboratorium':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'projekt':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'ćwiczenia':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getModeColor = (isRemote: boolean) => {
    return isRemote
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  };

  if (sortedDates.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Zjazdy (Weekendy)
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Brak zaplanowanych zjazdów weekendowych dla wybranych filtrów.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Zjazdy (Weekendy)
      </h2>

      <div className="space-y-6">
        {sortedDates.map((date) => {
          const entries = groupedByDate[date];
          const firstEntry = entries[0];

          return (
            <div
              key={date}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              {/* Date Header */}
              <div className="mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {date}{' '}
                  <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                    ({firstEntry.day})
                  </span>
                </h3>
              </div>

              {/* Entries List */}
              <div className="space-y-3">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-gray-50 dark:bg-gray-700 rounded-md p-3"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {entry.class_info.subject}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {entry.time}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1 items-start justify-end">
                        {entry.class_info.type && (
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(
                              entry.class_info.type
                            )}`}
                          >
                            {entry.class_info.type}
                          </span>
                        )}
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getModeColor(
                            entry.class_info.is_remote
                          )}`}
                        >
                          {entry.class_info.is_remote ? 'Zdalne' : 'Stacjonarne'}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      {entry.class_info.instructor && (
                        <p>
                          <span className="font-medium">Prowadzący:</span>{' '}
                          {entry.class_info.instructor}
                        </p>
                      )}

                      {!entry.class_info.is_remote && entry.class_info.room && (
                        <p>
                          <span className="font-medium">Sala:</span>{' '}
                          {entry.class_info.room}
                        </p>
                      )}

                      <p>
                        <span className="font-medium">Grupa:</span> {entry.group} |{' '}
                        {entry.kierunek} {entry.stopien} st., rok {entry.rok}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
