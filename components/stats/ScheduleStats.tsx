"use client";

import { useScheduleStore } from '@/lib/store';

export function ScheduleStats() {
  const { getStats } = useScheduleStore();
  const stats = getStats();

  return (
    <div className="bg-white border border-gray-200 p-4">
      <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-3">
        Statystyki
      </h2>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <div className="text-xl font-medium text-gray-900">
            {stats.totalClasses}
          </div>
          <div className="text-xs text-gray-500">
            Wszystkie zajęcia
          </div>
        </div>

        <div>
          <div className="text-xl font-medium text-gray-900">
            {stats.stationaryClasses}
          </div>
          <div className="text-xs text-gray-500">
            Stacjonarne
          </div>
        </div>

        <div>
          <div className="text-xl font-medium text-gray-900">
            {stats.remoteClasses}
          </div>
          <div className="text-xs text-gray-500">Zdalne</div>
        </div>
      </div>
    </div>
  );
}
