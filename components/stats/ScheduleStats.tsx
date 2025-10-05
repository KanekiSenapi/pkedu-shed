"use client";

import { useScheduleStore } from '@/lib/store';

export function ScheduleStats() {
  const { getStats } = useScheduleStore();
  const stats = getStats();

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
      <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
        Statystyki
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div>
          <div className="text-xl font-medium text-gray-900 dark:text-white">
            {stats.totalClasses}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Wszystkie
          </div>
        </div>

        <div>
          <div className="text-xl font-medium text-gray-900 dark:text-white">
            {stats.stationaryClasses}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Stacjonarne
          </div>
        </div>

        <div>
          <div className="text-xl font-medium text-gray-900 dark:text-white">
            {stats.remoteClasses}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Zdalne</div>
        </div>

        <div>
          <div className="text-xl font-medium text-gray-900 dark:text-white">
            {stats.totalWeekends}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Zjazdów</div>
        </div>
      </div>
    </div>
  );
}
