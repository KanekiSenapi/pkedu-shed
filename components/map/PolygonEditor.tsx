"use client";

import { useState } from 'react';
import { Polygon, useMapEvents } from 'react-leaflet';
import { LatLng } from 'leaflet';

interface PolygonData {
  id: string;
  name: string;
  points: [number, number][];
}

interface PolygonEditorProps {
  onPolygonsChange: (polygons: PolygonData[]) => void;
}

export function PolygonEditor({ onPolygonsChange }: PolygonEditorProps) {
  const [polygons, setPolygons] = useState<PolygonData[]>([]);
  const [currentPoints, setCurrentPoints] = useState<[number, number][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentName, setCurrentName] = useState('');

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        if (!isDrawing) return;

        const newPoint: [number, number] = [e.latlng.lat, e.latlng.lng];
        setCurrentPoints([...currentPoints, newPoint]);
      },
    });
    return null;
  };

  const startDrawing = () => {
    const name = prompt('Nazwa budynku (np. W-3, W-7):');
    if (!name) return;

    setCurrentName(name);
    setCurrentPoints([]);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    if (currentPoints.length < 3) {
      alert('Polygon musi mieć przynajmniej 3 punkty');
      return;
    }

    const newPolygon: PolygonData = {
      id: Date.now().toString(),
      name: currentName,
      points: currentPoints,
    };

    const updatedPolygons = [...polygons, newPolygon];
    setPolygons(updatedPolygons);
    onPolygonsChange(updatedPolygons);

    setCurrentPoints([]);
    setIsDrawing(false);
    setCurrentName('');
  };

  const cancelDrawing = () => {
    setCurrentPoints([]);
    setIsDrawing(false);
    setCurrentName('');
  };

  const deletePolygon = (id: string) => {
    const updated = polygons.filter(p => p.id !== id);
    setPolygons(updated);
    onPolygonsChange(updated);
  };

  const exportData = () => {
    const data = polygons.map(p => ({
      name: p.name,
      points: p.points,
      center: {
        lat: p.points.reduce((sum, pt) => sum + pt[0], 0) / p.points.length,
        lng: p.points.reduce((sum, pt) => sum + pt[1], 0) / p.points.length,
      },
    }));

    const text = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text);
    alert('Dane skopiowane do schowka!');
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
          }}
        />
      )}

      {/* Panel sterowania - będzie renderowany przez nadrzędny komponent */}
      <div className="hidden">
        {/* Dane do przekazania przez props */}
      </div>
    </>
  );
}

// Komponent panelu sterowania (używany poza mapą)
export function PolygonEditorControls({
  isDrawing,
  currentPoints,
  polygons,
  onStartDrawing,
  onFinishDrawing,
  onCancelDrawing,
  onDeletePolygon,
  onExportData,
}: {
  isDrawing: boolean;
  currentPoints: [number, number][];
  polygons: PolygonData[];
  onStartDrawing: () => void;
  onFinishDrawing: () => void;
  onCancelDrawing: () => void;
  onDeletePolygon: (id: string) => void;
  onExportData: () => void;
}) {
  return (
    <div className="bg-white border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Edytor polygonów</h3>

      {!isDrawing ? (
        <button
          onClick={onStartDrawing}
          className="w-full px-4 py-2 bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
        >
          + Nowy polygon
        </button>
      ) : (
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            Kliknij na mapę, aby dodać punkty ({currentPoints.length} punktów)
          </div>
          <div className="flex gap-2">
            <button
              onClick={onFinishDrawing}
              disabled={currentPoints.length < 3}
              className="flex-1 px-3 py-2 bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Zakończ
            </button>
            <button
              onClick={onCancelDrawing}
              className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-sm hover:bg-gray-300"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}

      {/* Aktualnie rysowane punkty */}
      {isDrawing && currentPoints.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs font-medium text-gray-600 mb-2">Punkty:</div>
          <div className="max-h-32 overflow-y-auto text-xs space-y-1">
            {currentPoints.map((pt, i) => (
              <div key={i} className="text-gray-600">
                {i + 1}. {pt[0].toFixed(6)}, {pt[1].toFixed(6)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista polygonów */}
      {polygons.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-gray-600">
              Polygony ({polygons.length})
            </div>
            <button
              onClick={onExportData}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Kopiuj dane
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {polygons.map(polygon => {
              const center = {
                lat: polygon.points.reduce((sum, pt) => sum + pt[0], 0) / polygon.points.length,
                lng: polygon.points.reduce((sum, pt) => sum + pt[1], 0) / polygon.points.length,
              };

              return (
                <div key={polygon.id} className="border border-gray-200 p-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium text-gray-900">{polygon.name}</div>
                    <button
                      onClick={() => onDeletePolygon(polygon.id)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Usuń
                    </button>
                  </div>
                  <div className="text-xs text-gray-600">
                    Punkty: {polygon.points.length}
                  </div>
                  <div className="text-xs text-gray-600">
                    Centrum: {center.lat.toFixed(6)}, {center.lng.toFixed(6)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export type { PolygonData };
