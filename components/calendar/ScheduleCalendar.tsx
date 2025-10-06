"use client";

import { useMemo, useState, useCallback, useEffect } from 'react';
import { Calendar, momentLocalizer, Event as BigCalendarEvent, View } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/pl';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@/app/calendar.css';
import { useScheduleStore } from '@/lib/store';
import { ScheduleEntry } from '@/types/schedule';
import { parseRoomFromText, findBuildingForRoom, Building } from '@/lib/campus-data';
import { MapModal } from '@/components/map/MapModal';
import { ClassActions } from '@/components/attendance/ClassActions';

// Configure moment locale
moment.locale('pl');
const localizer = momentLocalizer(moment);

interface CalendarEvent extends BigCalendarEvent {
  entry: ScheduleEntry;
}

interface ScheduleCalendarProps {
  entries?: ScheduleEntry[]; // Optional: if provided, use these instead of store
}

export function ScheduleCalendar({ entries: providedEntries }: ScheduleCalendarProps = {}) {
  const { filteredEntries: storeEntries } = useScheduleStore();
  const filteredEntries = providedEntries ?? storeEntries;
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEntry | null>(null);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [weekendsOnly, setWeekendsOnly] = useState(true);
  const [mapModal, setMapModal] = useState<{ building: Building; roomNumber: string } | null>(null);

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
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return filteredEntries
      .map((entry) => {
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
      })
      .filter((event) => {
        // W widoku Agenda pokazuj tylko przyszłe zajęcia (od dzisiaj)
        if (view === 'agenda') {
          return event.start >= today;
        }
        return true;
      });
  }, [filteredEntries, view]);

  // Sprawdź czy jest weekend
  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // Event style getter - clean minimal style
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const { entry } = event;

    // Clean minimal styling with subtle border
    const borderLeft = entry.class_info.is_remote ? '3px solid #60a5fa' : '3px solid #10b981';

    // Subtle background for week/day views to make events more visible
    const backgroundColor = view === 'week' || view === 'day' ? '#f9fafb' : '#ffffff';

    return {
      style: {
        backgroundColor,
        borderLeft,
        border: '1px solid #e5e7eb',
        borderRadius: '0',
        color: '#111827',
        fontSize: '0.75rem',
        padding: '2px 4px',
        boxShadow: 'none',
      },
    };
  }, [view]);

  // Day style getter - hide weekdays if needed
  const dayPropGetter = useCallback((date: Date) => {
    const weekend = isWeekend(date);

    if (weekendsOnly && !weekend) {
      return {
        style: {
          display: 'none', // Hide weekdays when "Tylko weekendy" is enabled
        },
      };
    }

    return {};
  }, [weekendsOnly]);

  // Custom event component with labels
  const CustomEvent = ({ event }: { event: CalendarEvent }) => {
    const type = event.entry.class_info.type || 'inne';
    const typeLabel = type === 'laboratorium' ? 'lab.' :
                      type === 'wykład' ? 'wyk.' :
                      type === 'ćwiczenia' ? 'ćw.' :
                      type === 'projekt' ? 'proj.' : type;
    const modeLabel = event.entry.class_info.is_remote ? 'zdalne' : 'stacj.';
    const modeBgColor = event.entry.class_info.is_remote ? 'bg-blue-50' : 'bg-green-50';
    const modeTextColor = event.entry.class_info.is_remote ? 'text-blue-700' : 'text-green-700';
    const modeBorderColor = event.entry.class_info.is_remote ? 'border-blue-200' : 'border-green-200';

    return (
      <div className="flex items-center gap-1">
        <span className="text-[10px] px-1 py-0.5 bg-gray-100 text-gray-600 border border-gray-200">
          {typeLabel}
        </span>
        <span className={`text-[10px] px-1 py-0.5 ${modeBgColor} ${modeTextColor} border ${modeBorderColor}`}>
          {modeLabel}
        </span>
        <span className="text-[11px] text-gray-900 truncate" title={event.entry.class_info.subject}>
          {event.entry.class_info.subject}
        </span>
      </div>
    );
  };

  // Custom date cell wrapper to add "ZJAZD" label to weekends with stationary classes
  const CustomDateCellWrapper = ({ children, value }: { children: React.ReactNode; value: Date }) => {
    const weekend = isWeekend(value);

    // Check if this day has stationary classes
    const hasStationaryClasses = view === 'month' && weekend && events.some(event => {
      const eventDate = event.start;
      if (!eventDate) return false;
      return (
        eventDate.getFullYear() === value.getFullYear() &&
        eventDate.getMonth() === value.getMonth() &&
        eventDate.getDate() === value.getDate() &&
        !event.entry.class_info.is_remote
      );
    });

    return (
      <div className="rbc-day-bg-wrapper">
        {children}
        {hasStationaryClasses && (
          <div className="absolute top-0 left-0 text-[8px] font-semibold px-1 py-0.5 bg-green-600 text-white uppercase tracking-wider">
            ZJAZD
          </div>
        )}
      </div>
    );
  };

  // Custom toolbar with week status
  const CustomToolbar = (toolbar: any) => {
    const getWeekStatus = () => {
      if (view !== 'week') return null;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Get the start and end of the displayed week
      const weekStart = new Date(toolbar.date);
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
      weekStart.setDate(diff);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Check if current week
      if (today >= weekStart && today <= weekEnd) {
        return { label: 'bieżący tydzień', color: 'text-blue-600' };
      }

      // Check if past week
      if (today > weekEnd) {
        return { label: 'przeszły tydzień', color: 'text-gray-500' };
      }

      // Future week
      return { label: 'przyszły tydzień', color: 'text-green-600' };
    };

    const weekStatus = getWeekStatus();

    return (
      <div className="rbc-toolbar">
        <span className="rbc-btn-group">
          <button type="button" onClick={() => toolbar.onNavigate('TODAY')}>
            {toolbar.localizer.messages.today}
          </button>
          <button type="button" onClick={() => toolbar.onNavigate('PREV')}>
            {toolbar.localizer.messages.previous}
          </button>
          <button type="button" onClick={() => toolbar.onNavigate('NEXT')}>
            {toolbar.localizer.messages.next}
          </button>
        </span>
        <span className="rbc-toolbar-label">
          {toolbar.label}
          {weekStatus && (
            <span className={`ml-2 text-xs font-medium ${weekStatus.color}`}>
              ({weekStatus.label})
            </span>
          )}
        </span>
        <span className="rbc-btn-group">
          {toolbar.views.map((name: string) => (
            <button
              key={name}
              type="button"
              className={toolbar.view === name ? 'rbc-active' : ''}
              onClick={() => toolbar.onView(name)}
            >
              {toolbar.localizer.messages[name]}
            </button>
          ))}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
        <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
          Kalendarz
        </h2>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Weekend Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={weekendsOnly}
              onChange={(e) => handleWeekendsOnlyChange(e.target.checked)}
              className="w-3.5 h-3.5 border-gray-300 rounded"
            />
            <span className="text-xs text-gray-600">
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
            dateCellWrapper: CustomDateCellWrapper,
            toolbar: CustomToolbar,
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
                      return building ? (
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
