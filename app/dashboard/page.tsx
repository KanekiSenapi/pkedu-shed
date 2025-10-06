"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSchedule } from '@/lib/use-schedule';
import {
  loadUserPreferences,
  type UserPreferences,
} from '@/lib/user-preferences';
import {
  filterScheduleByPreferences,
  getTodayClasses,
  getUpcomingClasses,
  getDashboardStats,
} from '@/lib/user-schedule';
import { ScheduleEntry } from '@/types/schedule';
import { UpcomingDaysCalendar } from '@/components/dashboard/UpcomingDaysCalendar';

export default function DashboardPage() {
  const router = useRouter();
  const { schedule, loading } = useSchedule();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    const prefs = loadUserPreferences();
    if (!prefs) {
      router.push('/begin');
      return;
    }
    setPreferences(prefs);
  }, [router]);

  if (loading || !preferences) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Ładowanie...</div>
        </div>
      </div>
    );
  }

  const filteredEntries = filterScheduleByPreferences(schedule, preferences);
  const todayClasses = getTodayClasses(filteredEntries);
  const upcomingClasses = getUpcomingClasses(filteredEntries);
  const stats = getDashboardStats(filteredEntries);

  const formatTime = (time: string) => {
    return time; // Already in HH:MM format
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateOnly = dateStr.split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (dateOnly === todayStr) return 'Dziś';
    if (dateOnly === tomorrowStr) return 'Jutro';

    const days = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
    return `${days[date.getDay()]}, ${date.getDate()}.${date.getMonth() + 1}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                {preferences.role === 'student'
                  ? `${preferences.stopien} stopień, Rok ${preferences.rok}, Grupa ${preferences.groups.join(', ')}`
                  : preferences.fullName}
              </p>
            </div>
            <button
              onClick={() => router.push('/begin')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Zmień ustawienia
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">Dziś</div>
            <div className="text-3xl font-bold text-blue-600">{stats.todayCount}</div>
            <div className="text-xs text-gray-500 mt-1">zajęć</div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">Ten tydzień</div>
            <div className="text-3xl font-bold text-gray-900">{stats.thisWeekCount}</div>
            <div className="text-xs text-gray-500 mt-1">zajęć</div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">Stacjonarne</div>
            <div className="text-3xl font-bold text-green-600">{stats.stationaryCount}</div>
            <div className="text-xs text-gray-500 mt-1">w tym tygodniu</div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">Zdalne</div>
            <div className="text-3xl font-bold text-purple-600">{stats.remoteCount}</div>
            <div className="text-xs text-gray-500 mt-1">w tym tygodniu</div>
          </div>
        </div>

        {/* Today's classes */}
        {todayClasses.length > 0 && (
          <div className="bg-white border border-gray-200 p-6 mb-8">
            <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">
              Dzisiejsze zajęcia
            </h2>
            <div className="space-y-3">
              {todayClasses.map(entry => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-blue-600 font-semibold">
                      {formatTime(entry.start_time)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {entry.class_info.subject}
                      </div>
                      <div className="text-sm text-gray-600">
                        {entry.class_info.type} • {entry.class_info.instructor}
                        {entry.class_info.room && ` • ${entry.class_info.room}`}
                      </div>
                    </div>
                  </div>
                  {entry.class_info.is_remote && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium">
                      Zdalne
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming classes */}
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Nadchodzące zajęcia
              </h2>
              <button
                onClick={() => router.push('/')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Zobacz pełny kalendarz →
              </button>
            </div>

            {upcomingClasses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Brak nadchodzących zajęć w najbliższym tygodniu
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingClasses.map(entry => {
                  const isToday = entry.date === new Date().toISOString().split('T')[0];

                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-4 border ${
                        isToday
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-xs text-gray-600">{formatDate(entry.date)}</div>
                          <div className={`font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                            {formatTime(entry.start_time)}
                          </div>
                        </div>
                        <div className="w-px h-12 bg-gray-300"></div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {entry.class_info.subject}
                          </div>
                          <div className="text-sm text-gray-600">
                            {entry.class_info.type}
                            {entry.class_info.instructor && ` • ${entry.class_info.instructor}`}
                            {entry.class_info.room && ` • ${entry.class_info.room}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.class_info.is_remote ? (
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium">
                            Zdalne
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium">
                            Stacjonarne
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Calendar */}
          <UpcomingDaysCalendar entries={filteredEntries} />
        </div>
      </div>
    </div>
  );
}
