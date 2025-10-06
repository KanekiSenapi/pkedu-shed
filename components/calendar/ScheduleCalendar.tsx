"use client";

import { useMemo, useState, useCallback, useEffect } from 'react';
import { Calendar, momentLocalizer, Event as BigCalendarEvent, View } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/pl';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@/app/calendar.css';
import { useScheduleStore } from '@/lib/store';
import { ScheduleEntry } from '@/types/schedule';
import { exportSingleEntry, exportAllEntries } from '@/lib/ics-export';

// Configure moment locale
moment.locale('pl');
const localizer = momentLocalizer(moment);

interface CalendarEvent extends BigCalendarEvent {
  entry: ScheduleEntry;
}

export function ScheduleCalendar() {
  const { filteredEntries } = useScheduleStore();
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEntry | null>(null);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [weekendsOnly, setWeekendsOnly] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const storedView = localStorage.getItem('calendar-view');
      if (storedView) {
        setView(storedView as View);
      }

      const storedWeekends = localStorage.getItem('calendar-weekends-only');
      if (storedWeekends !== null) {
        setWeekendsOnly(storedWeekends === 'true');
      }
    } catch (error) {
      console.error('Failed to load calendar settings from localStorage:', error);
    }
  }, []);

  // Save view to localStorage when it changes
  const handleViewChange = (newView: View) => {
    setView(newView);
    localStorage.setItem('calendar-view', newView);
  };

  // Handle date navigation (Previous, Next, Today buttons)
  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  // Save weekendsOnly to localStorage when it changes
  const handleWeekendsOnlyChange = (value: boolean) => {
    setWeekendsOnly(value);
    localStorage.setItem('calendar-weekends-only', String(value));
  };

  // Convert schedule entries to calendar events
  const events = useMemo<CalendarEvent[]>(() => {
    return filteredEntries.map((entry) => {
      const [year, month, day] = entry.date.split('-').map(Number);
      const [startHour, startMin] = entry.start_time.split(':').map(Number);
      const [endHour, endMin] = entry.end_time.split(':').map(Number);

      const start = new Date(year, month - 1, day, startHour, startMin);
      const end = new Date(year, month - 1, day, endHour, endMin);

      // Tytuł bez ikon - tylko nazwa przedmiotu
      const title = entry.class_info.subject;

      return {
        title,
        start,
        end,
        entry,
      };
    });
  }, [filteredEntries]);

  // Sprawdź czy jest weekend
  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // Event style getter - color based on type and mode
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const { entry } = event;
    let backgroundColor = '#3b82f6'; // default blue

    // Color by type
    if (entry.class_info.type === 'wykład') {
      backgroundColor = '#8b5cf6'; // purple
    } else if (entry.class_info.type === 'laboratorium') {
      backgroundColor = '#f59e0b'; // orange
    } else if (entry.class_info.type === 'projekt') {
      backgroundColor = '#ec4899'; // pink
    } else if (entry.class_info.type === 'ćwiczenia') {
      backgroundColor = '#06b6d4'; // cyan
    }

    // Dodaj gradientową ramkę dla zdalnych
    const borderLeft = entry.class_info.is_remote ? '4px solid #3b82f6' : '4px solid #10b981';

    return {
      style: {
        backgroundColor,
        borderLeft,
        borderRadius: '6px',
        color: 'white',
        fontSize: '0.75rem',
        padding: '2px 6px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        border: 'none',
      },
    };
  }, []);

  // Day style getter - highlight weekends or hide weekdays
  const dayPropGetter = useCallback((date: Date) => {
    const weekend = isWeekend(date);

    if (weekendsOnly && !weekend) {
      return {
        style: {
          display: 'none', // Hide weekdays when "Tylko weekendy" is enabled
        },
      };
    }

    if (weekend) {
      return {
        style: {
          backgroundColor: '#fef3c7', // light yellow for weekends
        },
      };
    }
    return {};
  }, [weekendsOnly]);

  // Custom event component with labels
  const CustomEvent = ({ event }: { event: CalendarEvent }) => {
    const typeLabel = event.entry.class_info.type || 'inne';
    const modeLabel = event.entry.class_info.is_remote ? 'zdalne' : 'stacj.';

    return (
      <div className="custom-event-content">
        <div className="event-tags">
          <span className="event-tag event-tag-type">{typeLabel}</span>
          <span className="event-tag event-tag-mode">{modeLabel}</span>
        </div>
        <div className="event-subject" title={event.entry.class_info.subject}>
          {event.entry.class_info.subject}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
        <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Kalendarz
        </h2>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Export to Calendar */}
          <button
            onClick={() => exportAllEntries(filteredEntries)}
            className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            Eksportuj .ics
          </button>

          {/* Weekend Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={weekendsOnly}
              onChange={(e) => handleWeekendsOnlyChange(e.target.checked)}
              className="w-3.5 h-3.5 border-gray-300 dark:border-gray-600 rounded"
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Tylko weekendy
            </span>
          </label>
        </div>
      </div>

      <div className="h-[700px]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          date={date}
          onNavigate={handleNavigate}
          eventPropGetter={eventStyleGetter}
          dayPropGetter={dayPropGetter}
          onSelectEvent={(event) => setSelectedEvent(event.entry)}
          view={view}
          onView={handleViewChange}
          views={['month', 'week', 'day', 'agenda']}
          components={{
            event: CustomEvent,
          }}
          popup
          popupOffset={{ x: 0, y: 20 }}
          showMultiDayTimes
          step={30}
          timeslots={2}
          min={new Date(2025, 0, 1, 7, 0, 0)}
          max={new Date(2025, 0, 1, 21, 0, 0)}
          messages={{
            next: 'Następny',
            previous: 'Poprzedni',
            today: 'Dzisiaj',
            month: 'Miesiąc',
            week: 'Tydzień',
            day: 'Dzień',
            agenda: 'Agenda',
            date: 'Data',
            time: 'Godzina',
            event: 'Zajęcia',
            showMore: (total) => `+${total} więcej`,
          }}
        />
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1 pr-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                  {selectedEvent.class_info.subject}
                </h3>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedEvent.class_info.type === 'wykład'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      : selectedEvent.class_info.type === 'laboratorium'
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                      : selectedEvent.class_info.type === 'projekt'
                      ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}>
                    {selectedEvent.class_info.type || 'Inne'}
                  </span>
                  {selectedEvent.class_info.is_remote && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      ZDALNIE
                    </span>
                  )}
                  <button
                    onClick={() => exportSingleEntry(selectedEvent)}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    title="Dodaj do kalendarza"
                  >
                    Pobierz .ics
                  </button>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl font-light leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-gray-500 dark:text-gray-400">📅</span>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Data i godzina</div>
                  <div className="text-gray-900 dark:text-white font-medium mt-1">
                    {selectedEvent.date}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <div className="text-gray-600 dark:text-gray-300 text-sm font-medium">
                      {selectedEvent.time}
                    </div>
                    <div className="text-gray-400">•</div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      selectedEvent.class_info.type === 'wykład'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        : selectedEvent.class_info.type === 'laboratorium'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                        : selectedEvent.class_info.type === 'projekt'
                        ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'
                        : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300'
                    }`}>
                      {selectedEvent.class_info.type || 'Inne'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      selectedEvent.class_info.is_remote
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    }`}>
                      {selectedEvent.class_info.is_remote ? 'Zdalne' : 'Stacjonarne'}
                    </span>
                  </div>
                </div>
              </div>

              {selectedEvent.class_info.instructor && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-gray-500 dark:text-gray-400">👤</span>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Prowadzący</div>
                    <div className="text-gray-900 dark:text-white mt-1">
                      {selectedEvent.class_info.instructor}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-gray-500 dark:text-gray-400">
                  {selectedEvent.class_info.is_remote ? '💻' : '📍'}
                </span>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Miejsce</div>
                  <div className="text-gray-900 dark:text-white mt-1">
                    {selectedEvent.class_info.is_remote
                      ? 'Zajęcia zdalne'
                      : selectedEvent.class_info.room || 'Nie określono'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Grupa</div>
                  <div className="text-gray-900 dark:text-white font-medium mt-1">
                    {selectedEvent.group}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Rok/Semestr</div>
                  <div className="text-gray-900 dark:text-white font-medium mt-1">
                    {selectedEvent.rok}/{selectedEvent.semestr}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedEvent.kierunek} {selectedEvent.stopien} stopień
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
