"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSchedule } from '@/lib/use-schedule';
import {
  syncLoadUserPreferences,
  type InstructorPreferences,
} from '@/lib/user-preferences';
import {
  getInstructorSchedule,
  getInstructorScheduleByName,
  groupBySubject,
  getInstructorStats,
  getUpcomingClasses,
  getTodayClasses,
} from '@/lib/instructor-schedule';
import { ScheduleEntry } from '@/types/schedule';
import { DashboardNavbar } from '@/components/dashboard/DashboardNavbar';
import { InstructorStats } from '@/components/dashboard/instructor/InstructorStats';
import { SubjectOverview } from '@/components/dashboard/instructor/SubjectOverview';
import { InstructorUpcomingClasses } from '@/components/dashboard/instructor/InstructorUpcomingClasses';
import { NextClassCountdown } from '@/components/dashboard/NextClassCountdown';
import { ScheduleCalendar } from '@/components/calendar/ScheduleCalendar';

export default function InstructorDashboard() {
  const router = useRouter();
  const { schedule, loading } = useSchedule();
  const [preferences, setPreferences] = useState<InstructorPreferences | null>(null);
  const [filteredEntries, setFilteredEntries] = useState<ScheduleEntry[]>([]);
  const [isFiltering, setIsFiltering] = useState(true);

  useEffect(() => {
    syncLoadUserPreferences().then(prefs => {
      if (!prefs) {
        router.push('/begin');
        return;
      }
      if (prefs.role !== 'instructor') {
        router.push('/dashboard');
        return;
      }
      setPreferences(prefs as InstructorPreferences);
    });
  }, [router]);

  useEffect(() => {
    if (!schedule || !preferences) return;

    const filterSchedule = async () => {
      setIsFiltering(true);

      let entries: ScheduleEntry[];

      // Use instructor ID for better filtering if available
      if (preferences.instructorId) {
        entries = await getInstructorSchedule(schedule, preferences.instructorId);
      } else {
        // Fallback to name-based filtering
        entries = getInstructorScheduleByName(schedule, preferences.fullName);
      }

      setFilteredEntries(entries);
      setIsFiltering(false);
    };

    filterSchedule();
  }, [schedule, preferences]);

  if (loading || !preferences || isFiltering) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Ładowanie...</div>
        </div>
      </div>
    );
  }

  const stats = getInstructorStats(filteredEntries);
  const todayClasses = getTodayClasses(filteredEntries);
  const upcomingClasses = getUpcomingClasses(filteredEntries);
  const groupedSubjects = groupBySubject(filteredEntries);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar preferences={preferences} />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome message */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Witaj, {preferences.fullName}
          </h1>
          <p className="text-gray-600 text-sm">
            Twój harmonogram zajęć
          </p>
        </div>

        {/* Stats */}
        <InstructorStats stats={stats} />

        {/* Next Class Countdown */}
        {todayClasses.length > 0 && (
          <div className="mb-8">
            <NextClassCountdown todayClasses={todayClasses} />
          </div>
        )}

        {/* Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Upcoming classes */}
          <InstructorUpcomingClasses classes={upcomingClasses} />

          {/* Subject overview */}
          <SubjectOverview subjects={groupedSubjects} />
        </div>

        {/* Full Calendar */}
        <div className="mb-6">
          <ScheduleCalendar entries={filteredEntries} />
        </div>

        {/* No classes message */}
        {filteredEntries.length === 0 && (
          <div className="bg-white border border-gray-200 p-8 text-center">
            <div className="text-gray-500">
              <p className="text-lg font-medium mb-2">Brak zajęć w planie</p>
              <p className="text-sm">
                Nie znaleziono zajęć przypisanych do Twojego konta.
              </p>
              {!preferences.instructorId && (
                <p className="text-xs text-gray-400 mt-4">
                  Spróbuj wylogować się i zalogować ponownie, wybierając swoje imię i nazwisko z listy.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
