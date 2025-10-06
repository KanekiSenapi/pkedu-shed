"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { RoomSearch } from '@/components/map/RoomSearch';

const InteractiveMap = dynamic(() => import('@/components/map/InteractiveMap').then(mod => mod.InteractiveMap), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-100">
      <div className="text-sm text-gray-600">Ładowanie mapy...</div>
    </div>
  ),
});

const RoutingLayer = dynamic(() => import('@/components/map/RoutingLayer').then(mod => mod.RoutingLayer), {
  ssr: false,
});

import { Building, RoomLocation, buildings, parseRoomFromText, findBuildingForRoom } from '@/lib/campus-data';
import { useRouter } from 'next/navigation';
import { useSchedule } from '@/lib/use-schedule';
import { syncLoadUserPreferences } from '@/lib/user-preferences';
import { filterScheduleByPreferences, getUpcomingClasses } from '@/lib/user-schedule';
import { ScheduleEntry } from '@/types/schedule';

export default function MapPage() {
  const router = useRouter();
  const { schedule, loading: scheduleLoading } = useSchedule();
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomLocation | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [nextClass, setNextClass] = useState<ScheduleEntry | null>(null);

  useEffect(() => {
    // Automatycznie pobierz lokalizację
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          let message = 'Nie udało się pobrać lokalizacji';
          if (error.code === error.PERMISSION_DENIED) {
            message = 'Odmówiono dostępu do lokalizacji. Zezwól na dostęp w ustawieniach przeglądarki.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            message = 'Lokalizacja niedostępna';
          } else if (error.code === error.TIMEOUT) {
            message = 'Przekroczono czas oczekiwania na lokalizację';
          }
          setLocationError(message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      setLocationError('Geolokalizacja nie jest wspierana przez twoją przeglądarkę');
    }

    // Check URL params for building and room
    const params = new URLSearchParams(window.location.search);
    const buildingId = params.get('building');
    const roomId = params.get('room');

    if (buildingId) {
      const building = buildings.find(b => b.id === buildingId);
      if (building) {
        setSelectedBuilding(building);

        if (roomId) {
          const roomLocation = {
            room: roomId,
            building: buildingId,
            fullName: `Sala ${roomId}`
          };
          setSelectedRoom(roomLocation);
        }
      }
      return;
    }

    // Załaduj najbliższe zajęcia
    syncLoadUserPreferences().then(prefs => {
      if (prefs && schedule) {
        const filtered = filterScheduleByPreferences(schedule, prefs);
        const upcoming = getUpcomingClasses(filtered);
        if (upcoming.length > 0) {
          setNextClass(upcoming[0]);

          // Automatycznie podświetl budynek następnych zajęć
          const roomText = upcoming[0].class_info.room;
          if (roomText) {
            const roomNumber = parseRoomFromText(roomText);
            if (roomNumber) {
              const building = findBuildingForRoom(roomNumber);
              if (building) {
                setSelectedBuilding(building);
              }
            }
          }
        }
      }
    });
  }, [schedule]);


  const handleRoomSelect = (room: RoomLocation, building: Building) => {
    setSelectedRoom(room);
    setSelectedBuilding(building);
  };

  const handleBuildingClick = (building: Building) => {
    setSelectedBuilding(building);
    setSelectedRoom(null);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
  };

  const getDistanceToBuilding = (building: Building): string | null => {
    if (!userLocation) return null;
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      building.lat,
      building.lng
    );
    if (distance < 1000) {
      return `${Math.round(distance)} m`;
    }
    return `${(distance / 1000).toFixed(1)} km`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-lg font-bold text-gray-900">Mapa Kampusu</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              ← Powrót
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6">
        {/* Search and Location */}
        <div className="mb-6 space-y-4">
          <RoomSearch onRoomSelect={handleRoomSelect} />

          {locationError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
              {locationError}
            </div>
          )}

          {userLocation && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm">
              📍 Twoja lokalizacja określona
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 p-4">
              <h2 className="text-sm font-medium text-gray-900 mb-4">
                Kampus Politechniki Krakowskiej - Warszawska 24
              </h2>
              <div className="h-[600px]">
                <InteractiveMap
                  buildings={buildings}
                  selectedBuilding={selectedBuilding}
                  onBuildingClick={handleBuildingClick}
                  userLocation={userLocation}
                >
                  {userLocation && selectedBuilding && selectedBuilding.entrance && (
                    <RoutingLayer
                      start={[userLocation.lat, userLocation.lng]}
                      end={selectedBuilding.entrance}
                    />
                  )}
                </InteractiveMap>
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-4">
            {/* Next Class Info */}
            {nextClass && (
              <div className="bg-blue-50 border border-blue-200 p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-3">📍 Twoje najbliższe zajęcia</h3>
                <div className="space-y-2">
                  <div className="text-sm font-bold text-blue-900">{nextClass.class_info.subject}</div>
                  <div className="text-xs text-blue-700">
                    {nextClass.day}, {nextClass.date.split('T')[0]} • {nextClass.time}
                  </div>
                  {nextClass.class_info.room && (
                    <div className="text-xs text-blue-700">
                      📍 {nextClass.class_info.room}
                    </div>
                  )}
                  {nextClass.class_info.instructor && (
                    <div className="text-xs text-blue-600">{nextClass.class_info.instructor}</div>
                  )}
                </div>
              </div>
            )}

            {/* Selected Room/Building Info */}
            {(selectedRoom || selectedBuilding) && (
              <div className="bg-white border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Wybrana lokalizacja</h3>

                {selectedRoom && (
                  <div className="mb-4">
                    <div className="text-lg font-bold text-gray-900">{selectedRoom.room}</div>
                    {selectedRoom.fullName && (
                      <div className="text-sm text-gray-600 mt-1">{selectedRoom.fullName}</div>
                    )}
                  </div>
                )}

                {selectedBuilding && (
                  <div>
                    <div className="text-sm font-medium text-gray-900">{selectedBuilding.shortName}</div>
                    <div className="text-sm text-gray-600 mt-1">{selectedBuilding.name}</div>
                    {selectedBuilding.description && (
                      <div className="text-xs text-gray-500 mt-2">{selectedBuilding.description}</div>
                    )}

                    {userLocation && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-500">Odległość od Ciebie</div>
                        <div className="text-lg font-bold text-blue-600">
                          {getDistanceToBuilding(selectedBuilding)}
                        </div>
                      </div>
                    )}

                    {selectedBuilding.rooms.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs font-medium text-gray-600 mb-2">Sale w budynku:</div>
                        <div className="flex flex-wrap gap-1">
                          {selectedBuilding.rooms.map(room => (
                            <span
                              key={room}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs border border-blue-200"
                            >
                              {room}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => {
                    setSelectedRoom(null);
                    setSelectedBuilding(null);
                  }}
                  className="mt-4 w-full px-3 py-2 bg-gray-200 text-gray-700 text-sm hover:bg-gray-300 transition-colors"
                >
                  Wyczyść wybór
                </button>
              </div>
            )}

            {/* Building List */}
            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Budynki WIiT</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {buildings
                  .filter(b => b.rooms.length > 0)
                  .map(building => (
                    <button
                      key={building.id}
                      onClick={() => handleBuildingClick(building)}
                      className="w-full text-left px-3 py-2 border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{building.shortName}</div>
                          <div className="text-xs text-gray-600 mt-1">{building.description}</div>
                        </div>
                        {userLocation && (
                          <div className="text-xs text-gray-500">
                            {getDistanceToBuilding(building)}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
