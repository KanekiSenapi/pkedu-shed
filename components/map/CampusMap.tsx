"use client";

import { useState } from 'react';
import { buildings, Building } from '@/lib/campus-data';

interface CampusMapProps {
  selectedBuilding?: string;
  onBuildingClick?: (building: Building) => void;
  userLocation?: { lat: number; lng: number };
}

export function CampusMap({ selectedBuilding, onBuildingClick, userLocation }: CampusMapProps) {
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);

  // Pozycje budynków na mapie SVG (względne, w skali 0-100)
  const buildingPositions: Record<string, { x: number; y: number }> = {
    'W-1': { x: 15, y: 75 },
    'W-2': { x: 85, y: 55 },
    'W-3': { x: 75, y: 35 },
    'W-4': { x: 40, y: 85 },
    'W-5': { x: 25, y: 40 },
    'W-6': { x: 55, y: 85 },
    'W-7': { x: 60, y: 25 },
    'W-8': { x: 85, y: 85 },
    'W-9': { x: 70, y: 65 },
    'W-10': { x: 35, y: 25 },
    'W-11': { x: 45, y: 15 },
    'W-12': { x: 50, y: 50 },
    'W-13': { x: 30, y: 55 },
    'W-15': { x: 10, y: 50 },
    'W-16': { x: 15, y: 35 },
    'W-17': { x: 20, y: 20 },
    'W-18': { x: 65, y: 75 },
    'W-19': { x: 80, y: 45 },
    'W-23': { x: 90, y: 20 },
    'W-24': { x: 92, y: 10 },
  };

  const handleBuildingClick = (building: Building) => {
    if (onBuildingClick) {
      onBuildingClick(building);
    }
  };

  return (
    <div className="relative w-full h-full bg-gray-100 border border-gray-200">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Tło kampusu */}
        <rect x="0" y="0" width="100" height="100" fill="#f3f4f6" />

        {/* Drogi / ścieżki */}
        <path
          d="M 5 50 L 95 50 M 50 5 L 50 95"
          stroke="#d1d5db"
          strokeWidth="0.5"
          fill="none"
        />

        {/* Budynki */}
        {buildings.map(building => {
          const pos = buildingPositions[building.id];
          if (!pos) return null;

          const isSelected = selectedBuilding === building.id;
          const isHovered = hoveredBuilding === building.id;
          const hasRooms = building.rooms.length > 0;

          return (
            <g
              key={building.id}
              onClick={() => handleBuildingClick(building)}
              onMouseEnter={() => setHoveredBuilding(building.id)}
              onMouseLeave={() => setHoveredBuilding(null)}
              className="cursor-pointer transition-all"
            >
              {/* Budynek - prostokąt */}
              <rect
                x={pos.x - 3}
                y={pos.y - 3}
                width="6"
                height="6"
                fill={
                  isSelected
                    ? '#2563eb'
                    : isHovered
                    ? '#60a5fa'
                    : hasRooms
                    ? '#3b82f6'
                    : '#9ca3af'
                }
                stroke={isSelected || isHovered ? '#1e40af' : '#6b7280'}
                strokeWidth="0.3"
                rx="0.5"
              />

              {/* Label budynku */}
              <text
                x={pos.x}
                y={pos.y + 8}
                textAnchor="middle"
                fontSize="2.5"
                fill="#374151"
                fontWeight={isSelected || isHovered ? 'bold' : 'normal'}
              >
                {building.shortName}
              </text>

              {/* Ikona sal informatycznych */}
              {hasRooms && (
                <circle
                  cx={pos.x + 2.5}
                  cy={pos.y - 2.5}
                  r="1"
                  fill="#10b981"
                  stroke="white"
                  strokeWidth="0.2"
                />
              )}
            </g>
          );
        })}

        {/* Lokalizacja użytkownika */}
        {userLocation && (
          <g>
            <circle
              cx="50"
              cy="50"
              r="2"
              fill="#ef4444"
              stroke="white"
              strokeWidth="0.5"
            >
              <animate
                attributeName="r"
                values="2;3;2"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </circle>
            <circle
              cx="50"
              cy="50"
              r="4"
              fill="none"
              stroke="#ef4444"
              strokeWidth="0.3"
              opacity="0.5"
            >
              <animate
                attributeName="r"
                values="4;6;4"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        )}
      </svg>

      {/* Legenda */}
      <div className="absolute bottom-2 left-2 bg-white border border-gray-200 p-2 text-xs">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 bg-blue-500 border border-gray-600"></div>
          <span>Budynki z salami WIiT</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 bg-gray-400 border border-gray-600"></div>
          <span>Inne budynki</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Twoja lokalizacja</span>
        </div>
      </div>

      {/* Tooltip dla hovera */}
      {hoveredBuilding && (
        <div className="absolute top-2 left-2 bg-white border border-gray-200 p-3 shadow-lg max-w-xs">
          {buildings.find(b => b.id === hoveredBuilding)?.name}
          {buildings.find(b => b.id === hoveredBuilding)?.description && (
            <div className="text-xs text-gray-600 mt-1">
              {buildings.find(b => b.id === hoveredBuilding)?.description}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
