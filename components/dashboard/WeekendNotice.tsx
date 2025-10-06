"use client";

import { ScheduleEntry } from '@/types/schedule';
import { checkUpcomingWeekend, formatWeekendDate } from '@/lib/weekend-checker';
import { useMemo } from 'react';

interface WeekendNoticeProps {
  entries: ScheduleEntry[];
}

export function WeekendNotice({ entries }: WeekendNoticeProps) {
  const weekendInfo = useMemo(() => checkUpcomingWeekend(entries), [entries]);

  if (!weekendInfo.hasClasses) {
    return (
      <div className="bg-green-50 border border-green-200 p-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🏠</div>
          <div>
            <div className="font-medium text-green-900">Wolny weekend!</div>
            <div className="text-sm text-green-700">
              Brak zajęć w weekend {formatWeekendDate(weekendInfo.weekendStart)}
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
              Weekend {formatWeekendDate(weekendInfo.weekendStart)} - wszystkie zajęcia zdalne
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 border border-orange-200 p-4">
      <div className="flex items-center gap-3">
        <div className="text-2xl">🎓</div>
        <div className="flex-1">
          <div className="font-medium text-orange-900">Zajęcia stacjonarne w weekend</div>
          <div className="text-sm text-orange-700">
            Weekend {formatWeekendDate(weekendInfo.weekendStart)} - {weekendInfo.stationaryCount}{' '}
            {weekendInfo.stationaryCount === 1 ? 'zajęcia' : 'zajęć'} stacjonarnych
          </div>
          {weekendInfo.saturdayClasses.filter(e => !e.class_info.is_remote).length > 0 && (
            <div className="text-xs text-orange-600 mt-1">
              Sobota: {weekendInfo.saturdayClasses.filter(e => !e.class_info.is_remote).map(e => e.class_info.subject).join(', ')}
            </div>
          )}
          {weekendInfo.sundayClasses.filter(e => !e.class_info.is_remote).length > 0 && (
            <div className="text-xs text-orange-600 mt-1">
              Niedziela: {weekendInfo.sundayClasses.filter(e => !e.class_info.is_remote).map(e => e.class_info.subject).join(', ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
