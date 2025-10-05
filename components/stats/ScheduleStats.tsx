"use client";

import { useScheduleStore } from '@/lib/store';

export function ScheduleStats() {
  const { getStats } = useScheduleStore();
  const stats = getStats();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Statystyki
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.totalClasses}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Wszystkie zajęcia
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.stationaryClasses}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Stacjonarne
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.remoteClasses}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Zdalne</div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.totalWeekends}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Zjazdów</div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Podział według typu zajęć
        </h3>

        <div className="space-y-2">
          {stats.byType.wykład > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-600 rounded"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Wykłady
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {stats.byType.wykład}
              </span>
            </div>
          )}

          {stats.byType.laboratorium > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-600 rounded"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Laboratoria
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {stats.byType.laboratorium}
              </span>
            </div>
          )}

          {stats.byType.projekt > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-pink-600 rounded"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Projekty
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {stats.byType.projekt}
              </span>
            </div>
          )}

          {stats.byType.ćwiczenia > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Ćwiczenia
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {stats.byType.ćwiczenia}
              </span>
            </div>
          )}

          {stats.byType.other > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-600 rounded"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Inne
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {stats.byType.other}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
