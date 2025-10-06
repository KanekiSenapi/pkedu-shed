"use client";

import { Polygon, useMapEvents } from 'react-leaflet';

export interface PolygonData {
  id: string;
  name: string;
  points: [number, number][];
}

interface PolygonEditorLayerProps {
  isDrawing: boolean;
  currentPoints: [number, number][];
  polygons: PolygonData[];
  onPointAdd: (point: [number, number]) => void;
}

export function PolygonEditorLayer({
  isDrawing,
  currentPoints,
  polygons,
  onPointAdd,
}: PolygonEditorLayerProps) {
  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        if (isDrawing) {
          onPointAdd([e.latlng.lat, e.latlng.lng]);
        }
      },
    });
    return null;
  };

  return (
    <>
      <MapClickHandler />

      {/* Renderuj zapisane polygony */}
      {polygons.map(polygon => (
        <Polygon
          key={polygon.id}
          positions={polygon.points}
          pathOptions={{
            color: 'blue',
            fillColor: 'blue',
            fillOpacity: 0.3,
          }}
        />
      ))}

      {/* Renderuj aktualnie rysowany polygon */}
      {isDrawing && currentPoints.length >= 3 && (
        <Polygon
          positions={currentPoints}
          pathOptions={{
            color: 'red',
            fillColor: 'red',
            fillOpacity: 0.3,
            dashArray: '5, 5',
          }}
        />
      )}
    </>
  );
}
