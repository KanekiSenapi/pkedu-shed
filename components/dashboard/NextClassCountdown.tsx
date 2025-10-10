"use client";

import { ScheduleEntry } from '@/types/schedule';
import { useEffect, useState } from 'react';
import { parseRoomFromText, findBuildingForRoom, Building } from '@/lib/campus-data';
import { MapModal } from '@/components/map/MapModal';

interface NextClassCountdownProps {
  todayClasses: ScheduleEntry[];
}

type ClassCard =
  | { type: 'before'; entry: ScheduleEntry; minutesUntil: number }
  | { type: 'during'; entry: ScheduleEntry; minutesRemaining: number };

export function NextClassCountdown({ todayClasses }: NextClassCountdownProps) {
  const [cards, setCards] = useState<ClassCard[]>([]);
  const [mapModal, setMapModal] = useState<{ building: Building; roomNumber: string } | null>(null);

  useEffect(() => {
    const calculateCards = (): ClassCard[] => {
      if (todayClasses.length === 0) {
        return [];
      }

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      // Sort classes by start time
      const sortedClasses = [...todayClasses].sort((a, b) =>
        a.start_time.localeCompare(b.start_time)
      );

      const result: ClassCard[] = [];

      for (const entry of sortedClasses) {
        const [startHour, startMinute] = entry.start_time.split(':').map(Number);
        const [endHour, endMinute] = entry.end_time.split(':').map(Number);

        const startTimeInMinutes = startHour * 60 + startMinute;
        const endTimeInMinutes = endHour * 60 + endMinute;

        // Check if class is currently happening
        if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes) {
          const minutesRemaining = endTimeInMinutes - currentTimeInMinutes;
          result.push({ type: 'during', entry, minutesRemaining });
        }

        // Check if class is in the future
        if (currentTimeInMinutes < startTimeInMinutes) {
          const minutesUntil = startTimeInMinutes - currentTimeInMinutes;
          result.push({ type: 'before', entry, minutesUntil });
        }
      }

      // Return max 3 cards
      return result.slice(0, 3);
    };

    // Initial calculation
    setCards(calculateCards());

    // Update every minute
    const interval = setInterval(() => {
      setCards(calculateCards());
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

  if (cards.length === 0) {
    return (
      <div className="bg-white border border-gray-200 p-6">
        <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
          Następne zajęcia
        </div>
        <div className="text-gray-500">
          {todayClasses.length === 0 ? 'Brak zajęć dzisiaj' : 'Wszystkie zajęcia zakończone'}
        </div>
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${cards.length === 1 ? 'grid-cols-1' : cards.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
      {cards.map((card, index) => {
        if (card.type === 'during') {
          return (
            <div key={index} className="bg-blue-50 border border-blue-200 p-6">
              <div className="text-sm font-medium text-blue-600 uppercase tracking-wide mb-2">
                Trwają zajęcia
              </div>
              <div className="text-xl font-bold text-blue-900 mb-1">
                {card.entry.class_info.subject}
              </div>
              <div className="text-sm text-blue-700 mb-2">
                Koniec za {formatTime(card.minutesRemaining)}
              </div>
              <div className="text-xs text-blue-600 mt-2 flex items-center gap-2">
                <span>
                  {card.entry.class_info.type}
                  {card.entry.class_info.instructor && ` • ${card.entry.class_info.instructor}`}
                  {card.entry.class_info.room && ` • ${card.entry.class_info.room}`}
                </span>
                {card.entry.class_info.room && (() => {
                  const roomNumber = parseRoomFromText(card.entry.class_info.room);
                  const building = roomNumber ? findBuildingForRoom(roomNumber) : null;
                  return building && roomNumber ? (
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
            </div>
          );
        }

        // card.type === 'before'
        return (
          <div key={index} className="bg-white border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
              Następne zajęcia
            </div>
            <div className="text-xl font-bold text-gray-900 mb-1">
              {card.entry.class_info.subject}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              {card.entry.start_time} - {card.entry.end_time}
            </div>
            <div className="text-2xl font-bold text-blue-600">
              za {formatTime(card.minutesUntil)}
            </div>
            <div className="text-xs text-gray-500 mt-2 flex items-center gap-2">
              <span>
                {card.entry.class_info.type}
                {card.entry.class_info.instructor && ` • ${card.entry.class_info.instructor}`}
                {card.entry.class_info.room && ` • ${card.entry.class_info.room}`}
              </span>
              {card.entry.class_info.room && (() => {
                const roomNumber = parseRoomFromText(card.entry.class_info.room);
                const building = roomNumber ? findBuildingForRoom(roomNumber) : null;
                return building && roomNumber ? (
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
        );
      })}

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
