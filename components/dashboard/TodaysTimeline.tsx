"use client";

import { ScheduleEntry } from '@/types/schedule';
import { useEffect, useRef, useState } from 'react';
import { parseRoomFromText, findBuildingForRoom, Building } from '@/lib/campus-data';
import { MapModal } from '@/components/map/MapModal';

interface TodaysTimelineProps {
  todayClasses: ScheduleEntry[];
}

interface TimeBlock {
  type: 'class' | 'free';
  startMinutes: number;
  endMinutes: number;
  entry?: ScheduleEntry;
}

const START_HOUR = 8;
const END_HOUR = 20;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const LUNCH_START_MINUTES = 13 * 60 + 15; // 13:15
const LUNCH_END_MINUTES = 14 * 60; // 14:00
const MIN_FREE_TIME_MINUTES = 45;

export function TodaysTimeline({ todayClasses }: TodaysTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState<number>(0);
  const [mapModal, setMapModal] = useState<{ building: Building; roomNumber: string } | null>(null);

  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      setCurrentTimeMinutes(minutes);
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Auto-scroll to current time on mount
    if (timelineRef.current && currentTimeMinutes > 0) {
      const scrollPosition = calculateTopPosition(currentTimeMinutes) - 100;
      timelineRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, [currentTimeMinutes]);

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const calculateTopPosition = (minutes: number): number => {
    const startMinutes = START_HOUR * 60;
    const totalMinutes = TOTAL_HOURS * 60;
    const relativeMinutes = minutes - startMinutes;
    const percentage = relativeMinutes / totalMinutes;
    return percentage * 100; // Return percentage
  };

  const calculateHeight = (durationMinutes: number): number => {
    const totalMinutes = TOTAL_HOURS * 60;
    return (durationMinutes / totalMinutes) * 100; // Return percentage
  };

  // Build timeline blocks (classes + free time gaps)
  const buildTimelineBlocks = (): TimeBlock[] => {
    if (todayClasses.length === 0) return [];

    const blocks: TimeBlock[] = [];
    const sortedClasses = [...todayClasses].sort((a, b) =>
      a.start_time.localeCompare(b.start_time)
    );

    for (let i = 0; i < sortedClasses.length; i++) {
      const current = sortedClasses[i];
      const startMinutes = timeToMinutes(current.start_time);
      const endMinutes = timeToMinutes(current.end_time);

      // Add class block
      blocks.push({
        type: 'class',
        startMinutes,
        endMinutes,
        entry: current,
      });

      // Check for gap to next class
      if (i < sortedClasses.length - 1) {
        const next = sortedClasses[i + 1];
        const gapStart = endMinutes;
        const gapEnd = timeToMinutes(next.start_time);
        const gapDuration = gapEnd - gapStart;

        // Only add free time if:
        // 1. Gap is >= 45 minutes
        // 2. Gap is NOT the lunch break (13:15-14:00)
        if (gapDuration >= MIN_FREE_TIME_MINUTES) {
          const isLunchBreak =
            gapStart === LUNCH_START_MINUTES && gapEnd === LUNCH_END_MINUTES;

          if (!isLunchBreak) {
            blocks.push({
              type: 'free',
              startMinutes: gapStart,
              endMinutes: gapEnd,
            });
          }
        }
      }
    }

    return blocks;
  };

  const blocks = buildTimelineBlocks();

  // Generate hour markers
  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

  const formatMinutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const showCurrentTimeLine =
    currentTimeMinutes >= START_HOUR * 60 && currentTimeMinutes <= END_HOUR * 60;

  if (todayClasses.length === 0) {
    return (
      <div className="bg-white border border-gray-200 p-6">
        <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">
          Oś czasu
        </h2>
        <div className="text-center text-gray-500 py-8">Brak zajęć dzisiaj</div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 p-6">
      <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">
        Oś czasu
      </h2>

      <div
        ref={timelineRef}
        className="relative h-96 overflow-y-auto border-l-2 border-gray-300 ml-12"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Hour markers */}
        {hours.map((hour) => {
          const minutes = hour * 60;
          const top = calculateTopPosition(minutes);

          return (
            <div
              key={hour}
              className="absolute left-0 -ml-12 text-xs text-gray-500 w-10 text-right"
              style={{ top: `${top}%`, transform: 'translateY(-50%)' }}
            >
              {String(hour).padStart(2, '0')}:00
            </div>
          );
        })}

        {/* Timeline blocks */}
        <div className="relative" style={{ height: '100%' }}>
          {blocks.map((block, idx) => {
            const top = calculateTopPosition(block.startMinutes);
            const height = calculateHeight(block.endMinutes - block.startMinutes);

            if (block.type === 'class' && block.entry) {
              return (
                <div
                  key={idx}
                  className="absolute left-2 right-2 bg-blue-50 border border-blue-200 p-2"
                  style={{ top: `${top}%`, height: `${height}%` }}
                >
                  <div className="text-xs font-medium text-blue-900">
                    {block.entry.class_info.subject}
                  </div>
                  <div className="text-xs text-blue-700">
                    {formatMinutesToTime(block.startMinutes)} -{' '}
                    {formatMinutesToTime(block.endMinutes)}
                  </div>
                  <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <span>
                      {block.entry.class_info.type}
                      {block.entry.class_info.room && ` • ${block.entry.class_info.room}`}
                    </span>
                    {block.entry.class_info.room && (() => {
                      const roomNumber = parseRoomFromText(block.entry.class_info.room);
                      const building = roomNumber ? findBuildingForRoom(roomNumber) : null;
                      return building ? (
                        <button
                          onClick={() => setMapModal({ building, roomNumber })}
                          className="text-blue-700 hover:text-blue-800 transition-colors"
                          title="Pokaż na mapie"
                        >
                          🗺️
                        </button>
                      ) : null;
                    })()}
                  </div>
                  {block.entry.class_info.is_remote && (
                    <div className="text-xs text-purple-600 mt-1">Zdalne</div>
                  )}
                </div>
              );
            }

            if (block.type === 'free') {
              const duration = block.endMinutes - block.startMinutes;
              return (
                <div
                  key={idx}
                  className="absolute left-2 right-2 bg-orange-50 border border-orange-200 p-2 flex items-center justify-center"
                  style={{ top: `${top}%`, height: `${height}%` }}
                >
                  <div className="text-center">
                    <div className="text-xs font-medium text-orange-900">Okienko</div>
                    <div className="text-xs text-orange-700">{duration} min</div>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Current time line */}
        {showCurrentTimeLine && (
          <div
            className="absolute left-0 right-0 border-t-2 border-red-500 z-10"
            style={{ top: `${calculateTopPosition(currentTimeMinutes)}%` }}
          >
            <div className="absolute left-2 -mt-3 bg-red-500 text-white text-xs px-2 py-1 font-medium">
              TERAZ
            </div>
          </div>
        )}
      </div>

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
