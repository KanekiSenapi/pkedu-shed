"use client";

import { useState } from 'react';
import { searchRooms, findBuildingForRoom, RoomLocation, Building } from '@/lib/campus-data';

interface RoomSearchProps {
  onRoomSelect: (room: RoomLocation, building: Building) => void;
}

export function RoomSearch({ onRoomSelect }: RoomSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RoomLocation[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.trim()) {
      const searchResults = searchRooms(value);
      setResults(searchResults);
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(false);
    }
  };

  const handleSelect = (room: RoomLocation) => {
    const building = findBuildingForRoom(room.room);
    if (building) {
      onRoomSelect(room, building);
      setQuery(room.room);
      setShowResults(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query && setShowResults(true)}
          placeholder="Wyszukaj salę (np. 135, S-1, KI-135a)..."
          className="w-full px-4 py-2 pr-10 border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
        />
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-lg max-h-64 overflow-y-auto z-50">
          {results.map((room, index) => {
            const building = findBuildingForRoom(room.room);
            return (
              <button
                key={index}
                onClick={() => handleSelect(room)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="font-medium text-gray-900">{room.room}</div>
                {room.fullName && (
                  <div className="text-xs text-gray-600 mt-1">{room.fullName}</div>
                )}
                {building && (
                  <div className="text-xs text-gray-500 mt-1">
                    📍 {building.shortName} - {building.name}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {showResults && query && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-lg p-4 text-sm text-gray-500 z-50">
          Nie znaleziono sali "{query}"
        </div>
      )}
    </div>
  );
}
