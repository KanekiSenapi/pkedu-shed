"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Building } from '@/lib/campus-data';

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

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  building: Building;
  roomNumber?: string;
}

export function MapModal({ isOpen, onClose, building, roomNumber }: MapModalProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Automatycznie pobierz lokalizację
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(userLoc);

          // Calculate distance
          if (building.entrance) {
            const dist = calculateDistance(
              userLoc.lat,
              userLoc.lng,
              building.entrance[0],
              building.entrance[1]
            );
            if (dist < 1000) {
              setDistance(`${Math.round(dist)} m`);
            } else {
              setDistance(`${(dist / 1000).toFixed(1)} km`);
            }
          }
        },
        () => {
          // Silently fail - user will just not see their location
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    }
  }, [isOpen, building]);

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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/20 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{building.shortName}</h2>
            <div className="text-sm text-gray-600 mt-1">{building.name}</div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-light leading-none"
          >
            ×
          </button>
        </div>

        {/* Map */}
        <div className="flex-1">
          <InteractiveMap
            buildings={[building]}
            selectedBuilding={building}
            userLocation={userLocation}
            onBuildingClick={() => {}}
          >
            {userLocation && building.entrance && (
              <RoutingLayer
                start={[userLocation.lat, userLocation.lng]}
                end={building.entrance}
              />
            )}
          </InteractiveMap>
        </div>

        {/* Info Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roomNumber && (
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                <span className="text-2xl">📍</span>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Sala</div>
                  <div className="text-lg font-bold text-blue-600 mt-1">{roomNumber}</div>
                </div>
              </div>
            )}

            {building.description && (
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                <span className="text-2xl">🏛️</span>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Opis</div>
                  <div className="text-sm text-gray-900 mt-1">{building.description}</div>
                </div>
              </div>
            )}

            {distance && (
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                <span className="text-2xl">🚶</span>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Odległość</div>
                  <div className="text-lg font-bold text-green-600 mt-1">{distance}</div>
                </div>
              </div>
            )}
          </div>

          {building.rooms.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">Sale w budynku:</div>
              <div className="flex flex-wrap gap-2">
                {building.rooms.map(room => (
                  <span
                    key={room}
                    className={`px-3 py-1 text-xs font-medium rounded ${
                      room === roomNumber
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-200'
                    }`}
                  >
                    {room}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
