"use client";

import { useSchedule } from '@/lib/use-schedule';
import { Navbar } from '@/components/layout/Navbar';
import { Filters } from '@/components/filters/Filters';
import { ScheduleCalendar } from '@/components/calendar/ScheduleCalendar';
import { ScheduleStats } from '@/components/stats/ScheduleStats';

export default function Home() {
  const { loading, error } = useSchedule();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">
              <strong>Błąd:</strong> {error}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-lg text-gray-600 dark:text-gray-400">
                Pobieranie planu zajęć...
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!loading && (
          <div className="space-y-6">
            {/* Filters */}
            <Filters />

            {/* Stats */}
            <ScheduleStats />

            {/* Calendar */}
            <ScheduleCalendar />
          </div>
        )}
      </main>
    </div>
  );
}
