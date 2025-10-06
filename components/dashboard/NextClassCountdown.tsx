"use client";

import { ScheduleEntry } from '@/types/schedule';
import { useEffect, useState } from 'react';

interface NextClassCountdownProps {
  todayClasses: ScheduleEntry[];
}

type ClassState =
  | { type: 'before'; entry: ScheduleEntry; minutesUntil: number }
  | { type: 'during'; entry: ScheduleEntry; minutesRemaining: number }
  | { type: 'finished' }
  | { type: 'none' };

export function NextClassCountdown({ todayClasses }: NextClassCountdownProps) {
  const [state, setState] = useState<ClassState>({ type: 'none' });

  useEffect(() => {
    const calculateState = (): ClassState => {
      if (todayClasses.length === 0) {
        return { type: 'none' };
      }

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      // Sort classes by start time
      const sortedClasses = [...todayClasses].sort((a, b) =>
        a.start_time.localeCompare(b.start_time)
      );

      for (const entry of sortedClasses) {
        const [startHour, startMinute] = entry.start_time.split(':').map(Number);
        const [endHour, endMinute] = entry.end_time.split(':').map(Number);

        const startTimeInMinutes = startHour * 60 + startMinute;
        const endTimeInMinutes = endHour * 60 + endMinute;

        // Check if class is currently happening
        if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes) {
          const minutesRemaining = endTimeInMinutes - currentTimeInMinutes;
          return { type: 'during', entry, minutesRemaining };
        }

        // Check if class is in the future
        if (currentTimeInMinutes < startTimeInMinutes) {
          const minutesUntil = startTimeInMinutes - currentTimeInMinutes;
          return { type: 'before', entry, minutesUntil };
        }
      }

      // All classes are finished
      return { type: 'finished' };
    };

    // Initial calculation
    setState(calculateState());

    // Update every minute
    const interval = setInterval(() => {
      setState(calculateState());
    }, 60000);

    return () => clearInterval(interval);
  }, [todayClasses]);

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${mins}min`;
  };

  if (state.type === 'none') {
    return (
      <div className="bg-white border border-gray-200 p-6">
        <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
          Następne zajęcia
        </div>
        <div className="text-gray-500">Brak zajęć dzisiaj</div>
      </div>
    );
  }

  if (state.type === 'finished') {
    return (
      <div className="bg-white border border-gray-200 p-6">
        <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
          Następne zajęcia
        </div>
        <div className="text-green-600 font-medium">Wszystkie zajęcia zakończone</div>
      </div>
    );
  }

  if (state.type === 'during') {
    return (
      <div className="bg-blue-50 border border-blue-200 p-6">
        <div className="text-sm font-medium text-blue-600 uppercase tracking-wide mb-2">
          Trwają zajęcia
        </div>
        <div className="text-xl font-bold text-blue-900 mb-1">
          {state.entry.class_info.subject}
        </div>
        <div className="text-sm text-blue-700">
          Koniec za {formatTime(state.minutesRemaining)}
        </div>
        <div className="text-xs text-blue-600 mt-2">
          {state.entry.class_info.type}
          {state.entry.class_info.instructor && ` • ${state.entry.class_info.instructor}`}
          {state.entry.class_info.room && ` • ${state.entry.class_info.room}`}
        </div>
      </div>
    );
  }

  // state.type === 'before'
  return (
    <div className="bg-white border border-gray-200 p-6">
      <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
        Następne zajęcia
      </div>
      <div className="text-xl font-bold text-gray-900 mb-1">
        {state.entry.class_info.subject}
      </div>
      <div className="text-sm text-gray-600 mb-2">
        {state.entry.start_time} - {state.entry.end_time}
      </div>
      <div className="text-2xl font-bold text-blue-600">
        za {formatTime(state.minutesUntil)}
      </div>
      <div className="text-xs text-gray-500 mt-2">
        {state.entry.class_info.type}
        {state.entry.class_info.instructor && ` • ${state.entry.class_info.instructor}`}
        {state.entry.class_info.room && ` • ${state.entry.class_info.room}`}
      </div>
    </div>
  );
}
