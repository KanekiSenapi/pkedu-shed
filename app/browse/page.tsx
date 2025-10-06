"use client";

import { useState, useEffect } from 'react';
import { useSchedule } from '@/lib/use-schedule';
import { DashboardNavbar } from '@/components/dashboard/DashboardNavbar';
import { loadUserPreferences, type UserPreferences } from '@/lib/user-preferences';
import { SearchBar } from '@/components/search/SearchBar';
import { Filters } from '@/components/filters/Filters';
import { ScheduleCalendar } from '@/components/calendar/ScheduleCalendar';
import { ScheduleStats } from '@/components/stats/ScheduleStats';
import { SubjectStatsTable } from '@/components/stats/SubjectStatsTable';
import { StationaryDaysCalendar } from '@/components/stats/StationaryDaysCalendar';

export default function BrowsePage() {
  const { loading, error } = useSchedule();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    const prefs = loadUserPreferences();
    setPreferences(prefs);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar preferences={preferences} />

      <main className="container mx-auto px-4 py-8">
        {/* Loading State */}
        {loading && !error && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-lg text-gray-600">
                Pobieranie planu zajęć...
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!loading && (
          <div className="space-y-6">
            {/* Search */}
            <SearchBar />

            {/* Stats */}
            <ScheduleStats />

            {/* Filters */}
            <Filters />

            {/* Calendar */}
            <ScheduleCalendar />

            {/* Grid layout for additional stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subject Stats Table */}
              <SubjectStatsTable />

              {/* Stationary Days Calendar */}
              <StationaryDaysCalendar />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
