"use client";

import { useScheduleStore } from '@/lib/store';
import { useMemo } from 'react';

export function StationaryDaysCalendar() {
  const { getStationaryDays } = useScheduleStore();
  const stationaryDays = getStationaryDays();

  // Filter only future days
  const futureDays = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return stationaryDays.filter(day => {
      const [year, month, dayNum] = day.date.split('-').map(Number);
      const dayDate = new Date(year, month - 1, dayNum);
      return dayDate >= today;
    });
  }, [stationaryDays]);

  if (futureDays.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 p-4">
      <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-3">
        Dni z zajęciami stacjonarnymi
      </h2>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {futureDays.map((day) => (
          <div
            key={day.date}
            className="border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{day.date}</span>
                <span className="text-xs text-gray-500">({day.dayName})</span>
              </div>
              <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 border border-green-200">
                {day.classCount} {day.classCount === 1 ? 'zajęcia' : 'zajęć'}
              </span>
            </div>

            <div className="space-y-1">
              {day.entries.map((entry, idx) => (
                <div key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                  <span className="font-mono text-gray-500">{entry.time}</span>
                  <span className="text-gray-900">{entry.class_info.subject}</span>
                  {entry.class_info.type && (
                    <span className="text-gray-500">({entry.class_info.type})</span>
                  )}
                  {entry.class_info.room && (
                    <span className="text-gray-500">• {entry.class_info.room}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
