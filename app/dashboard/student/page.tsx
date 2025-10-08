"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSchedule } from '@/lib/use-schedule';
import {
  syncLoadUserPreferences,
  type UserPreferences,
} from '@/lib/user-preferences';
import {
  filterScheduleByPreferences,
  getTodayClasses,
  getUpcomingClasses,
  getPastClasses,
  getDashboardStats,
} from '@/lib/user-schedule';
import { ScheduleEntry } from '@/types/schedule';
import { UpcomingDaysCalendar } from '@/components/dashboard/UpcomingDaysCalendar';
import { WeekendNotice } from '@/components/dashboard/WeekendNotice';
import { NextClassCountdown } from '@/components/dashboard/NextClassCountdown';
import { TodaysTimeline } from '@/components/dashboard/TodaysTimeline';
import { SubjectProgress } from '@/components/dashboard/SubjectProgress';
import { ScheduleCalendar } from '@/components/calendar/ScheduleCalendar';
import { DashboardNavbar } from '@/components/dashboard/DashboardNavbar';
import { parseRoomFromText, findBuildingForRoom, Building } from '@/lib/campus-data';
import { MapModal } from '@/components/map/MapModal';
import { AttendanceStats } from '@/components/attendance/AttendanceStats';
import { ClassActions } from '@/components/attendance/ClassActions';

export default function DashboardPage() {
  const router = useRouter();
  const { schedule, loading } = useSchedule();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [mapModal, setMapModal] = useState<{ building: Building; roomNumber: string } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEntry | null>(null);
  const [classesView, setClassesView] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    syncLoadUserPreferences().then(prefs => {
      if (!prefs) {
        router.push('/begin');
        return;
      }
      setPreferences(prefs);
    });
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
  const pastClasses = getPastClasses(filteredEntries);
  const stats = getDashboardStats(filteredEntries);

  const displayedClasses = classesView === 'upcoming' ? upcomingClasses : pastClasses;

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

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const hasFreeTimeGap = (currentEntry: ScheduleEntry, index: number, classList: ScheduleEntry[]): { hasgap: boolean; duration: number } => {
    if (index === 0) return { hasgap: false, duration: 0 };

    const previousEntry = classList[index - 1];
    if (!previousEntry || previousEntry.date !== currentEntry.date) return { hasgap: false, duration: 0 };

    const gapStart = timeToMinutes(previousEntry.end_time);
    const gapEnd = timeToMinutes(currentEntry.start_time);
    const gapDuration = gapEnd - gapStart;

    const MIN_FREE_TIME_MINUTES = 45;
    const LUNCH_START = 13 * 60 + 15; // 13:15
    const LUNCH_END = 14 * 60; // 14:00

    if (gapDuration >= MIN_FREE_TIME_MINUTES) {
      const isLunchBreak = gapStart === LUNCH_START && gapEnd === LUNCH_END;
      if (!isLunchBreak) {
        return { hasgap: true, duration: gapDuration };
      }
    }

    return { hasgap: false, duration: 0 };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <DashboardNavbar preferences={preferences} />

      <div className="container mx-auto px-4 py-8">
        {/* Weekend Notice */}
        <div className="mb-6">
          <WeekendNotice entries={filteredEntries} />
        </div>

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

        {/* Next Class Countdown */}
        <div className="mb-8">
          <NextClassCountdown todayClasses={todayClasses} />
        </div>

        {/* Today's Timeline */}
        {todayClasses.length > 0 && (
          <div className="mb-8">
            <TodaysTimeline todayClasses={todayClasses} />
          </div>
        )}

        {/* Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming classes */}
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                {classesView === 'upcoming' ? 'Nadchodzące zajęcia' : 'Poprzednie zajęcia'}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setClassesView('upcoming')}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                    classesView === 'upcoming'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Nadchodzące
                </button>
                <button
                  onClick={() => setClassesView('past')}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                    classesView === 'past'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Poprzednie
                </button>
              </div>
            </div>

            {displayedClasses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {classesView === 'upcoming'
                  ? 'Brak nadchodzących zajęć w najbliższym tygodniu'
                  : 'Brak poprzednich zajęć z ostatniego tygodnia'}
              </p>
            ) : (
              <div className="space-y-3">
                {displayedClasses.map((entry, index) => {
                  const isToday = entry.date === new Date().toISOString().split('T')[0];
                  const freeTimeGap = hasFreeTimeGap(entry, index, displayedClasses);
                  const isPast = classesView === 'past';

                  return (
                    <div
                      key={entry.id}
                      onClick={() => setSelectedEvent(entry)}
                      className={`flex items-center justify-between p-4 border cursor-pointer hover:shadow-md transition-shadow ${
                        isToday
                          ? 'bg-blue-50 border-blue-200'
                          : isPast
                            ? 'bg-gray-100 border-gray-300'
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
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-gray-900">
                              {entry.class_info.subject}
                            </div>
                            {freeTimeGap.hasgap && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium border border-orange-300">
                                okienko
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center gap-2">
                            <span>
                              {entry.class_info.type}
                              {entry.class_info.instructor && ` • ${entry.class_info.instructor}`}
                              {entry.class_info.room && ` • ${entry.class_info.room}`}
                            </span>
                            {entry.class_info.room && (() => {
                              const roomNumber = parseRoomFromText(entry.class_info.room);
                              const building = roomNumber ? findBuildingForRoom(roomNumber) : null;
                              return (building && roomNumber) ? (
                                <button
                                  onClick={() => setMapModal({ building, roomNumber })}
                                  className="text-blue-600 hover:text-blue-700 transition-colors"
                                  title="Pokaż na mapie"
                                >
                                  🗺️
                                </button>
                              ) : null;
                            })()}
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

        {/* Subject Progress */}
        <div className="mt-6">
          <SubjectProgress entries={filteredEntries} />
        </div>

        {/* Attendance Statistics */}
        <div className="mt-6">
          <AttendanceStats />
        </div>

        {/* Calendar */}
        <div className="mt-6">
          <ScheduleCalendar entries={filteredEntries} />
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1 pr-4">
                <h3 className="text-xl font-bold text-gray-900 leading-tight">
                  {selectedEvent.class_info.subject}
                </h3>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                    {selectedEvent.class_info.type || 'Inne'}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium border ${
                    selectedEvent.class_info.is_remote
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-green-50 text-green-700 border-green-200'
                  }`}>
                    {selectedEvent.class_info.is_remote ? 'ZDALNIE' : 'STACJONARNE'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-light leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500">📅</span>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Data i godzina</div>
                  <div className="text-gray-900 font-medium mt-1">
                    {selectedEvent.date}
                  </div>
                  <div className="text-gray-600 text-sm font-medium mt-1">
                    {selectedEvent.time}
                  </div>
                </div>
              </div>

              {selectedEvent.class_info.instructor && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-500">👤</span>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Prowadzący</div>
                    <div className="text-gray-900 mt-1">
                      {selectedEvent.class_info.instructor}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500">
                  {selectedEvent.class_info.is_remote ? '💻' : '📍'}
                </span>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Miejsce</div>
                  <div className="text-gray-900 mt-1 flex items-center gap-2">
                    <span>
                      {selectedEvent.class_info.is_remote
                        ? 'Zajęcia zdalne'
                        : selectedEvent.class_info.room || 'Nie określono'}
                    </span>
                    {!selectedEvent.class_info.is_remote && selectedEvent.class_info.room && (() => {
                      const roomNumber = parseRoomFromText(selectedEvent.class_info.room);
                      const building = roomNumber ? findBuildingForRoom(roomNumber) : null;
                      return (building && roomNumber) ? (
                        <button
                          onClick={() => {
                            setMapModal({ building, roomNumber });
                            setSelectedEvent(null);
                          }}
                          className="text-blue-600 hover:text-blue-700 transition-colors"
                          title="Pokaż na mapie"
                        >
                          🗺️
                        </button>
                      ) : null;
                    })()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Grupa</div>
                  <div className="text-gray-900 font-medium mt-1">
                    {selectedEvent.group}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Rok/Semestr</div>
                  <div className="text-gray-900 font-medium mt-1">
                    {selectedEvent.rok}/{selectedEvent.semestr}
                  </div>
                </div>
              </div>

              {/* Class Actions */}
              <div className="pt-4 border-t border-gray-200">
                <ClassActions
                  date={selectedEvent.date}
                  time={selectedEvent.time}
                  subject={selectedEvent.class_info.subject}
                />
              </div>

              <div className="pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  {selectedEvent.kierunek} {selectedEvent.stopien} stopień
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {mapModal && (
        <MapModal
          isOpen={true}
          onClose={() => setMapModal(null)}
          building={mapModal.building}
          roomNumber={mapModal.roomNumber}
        />
      )}
    </div>
  );
}
