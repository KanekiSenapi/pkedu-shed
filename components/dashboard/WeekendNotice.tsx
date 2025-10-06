"use client";

import { ScheduleEntry } from '@/types/schedule';
import { checkUpcomingWeekend, formatWeekendDate } from '@/lib/weekend-checker';
import { useMemo } from 'react';

interface WeekendNoticeProps {
  entries: ScheduleEntry[];
}

export function WeekendNotice({ entries }: WeekendNoticeProps) {
  const weekendInfo = useMemo(() => checkUpcomingWeekend(entries), [entries]);

  const weekendDateStr = formatWeekendDate(weekendInfo.weekendStart, weekendInfo.weekendEnd);

  if (!weekendInfo.hasClasses) {
    return (
      <div className="bg-green-50 border border-green-200 p-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🏠</div>
          <div>
            <div className="font-medium text-green-900">Wolny weekend!</div>
            <div className="text-sm text-green-700">
              Brak zajęć w weekend {weekendDateStr}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (weekendInfo.stationaryCount === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 p-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">💻</div>
          <div>
            <div className="font-medium text-blue-900">Zajęcia zdalne w weekend</div>
            <div className="text-sm text-blue-700">
              Weekend {weekendDateStr} - wszystkie zajęcia zdalne
            </div>
          </div>
        </div>
      </div>
    );
  }

  const saturdayStationary = weekendInfo.saturdayClasses.filter(e => !e.class_info.is_remote);
  const sundayStationary = weekendInfo.sundayClasses.filter(e => !e.class_info.is_remote);

  return (
    <div className="bg-orange-50 border border-orange-200 p-4">
      <div className="flex items-center gap-3">
        <div className="text-2xl">🎓</div>
        <div className="flex-1">
          <div className="font-medium text-orange-900">Zajęcia stacjonarne w weekend</div>
          <div className="text-sm text-orange-700">
            Weekend {weekendDateStr} - {weekendInfo.stationaryCount}{' '}
            {weekendInfo.stationaryCount === 1
              ? 'blok zajęć'
              : weekendInfo.stationaryCount < 5
                ? 'bloki zajęć'
                : 'bloków zajęć'} stacjonarnych
          </div>
          {saturdayStationary.length > 0 && (
            <div className="text-xs text-orange-600 mt-1">
              Sobota: {saturdayStationary.map(e => e.class_info.subject).join(', ')}
            </div>
          )}
          {sundayStationary.length > 0 && (
            <div className="text-xs text-orange-600 mt-1">
              Niedziela: {sundayStationary.map(e => e.class_info.subject).join(', ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
