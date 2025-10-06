"use client";

import { useState } from 'react';
import { Polygon, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

export interface BuildingMapping {
  id: string;
  name: string;
  polygon: [number, number][];
  entrance: [number, number];
  center: [number, number];
}

interface BuildingMappingWizardProps {
  onComplete: (mappings: BuildingMapping[]) => void;
}

type Step = 'name' | 'polygon' | 'entrance' | 'confirm';

export function BuildingMappingWizard({ onComplete }: BuildingMappingWizardProps) {
  const [step, setStep] = useState<Step>('name');
  const [currentName, setCurrentName] = useState('');
  const [currentPolygon, setCurrentPolygon] = useState<[number, number][]>([]);
  const [currentEntrance, setCurrentEntrance] = useState<[number, number] | null>(null);
  const [buildings, setBuildings] = useState<BuildingMapping[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const entranceIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        if (step === 'polygon') {
          setCurrentPolygon([...currentPolygon, [e.latlng.lat, e.latlng.lng]]);
        } else if (step === 'entrance') {
          setCurrentEntrance([e.latlng.lat, e.latlng.lng]);
        }
      },
    });
    return null;
  };

  const handleNameSubmit = () => {
    if (!currentName.trim()) {
      alert('Podaj nazwę budynku');
      return;
    }
    setStep('polygon');
  };

  const handlePolygonComplete = () => {
    if (currentPolygon.length < 3) {
      alert('Polygon musi mieć przynajmniej 3 punkty');
      return;
    }
    setStep('entrance');
  };

  const handleEntranceComplete = () => {
    if (!currentEntrance) {
      alert('Zaznacz wejście do budynku');
      return;
    }
    setStep('confirm');
  };

  const handleConfirm = () => {
    if (!currentEntrance) return;

    const center: [number, number] = [
      currentPolygon.reduce((sum, pt) => sum + pt[0], 0) / currentPolygon.length,
      currentPolygon.reduce((sum, pt) => sum + pt[1], 0) / currentPolygon.length,
    ];

    const newBuilding: BuildingMapping = {
      id: editingId || Date.now().toString(),
      name: currentName,
      polygon: currentPolygon,
      entrance: currentEntrance,
      center,
    };

    if (editingId) {
      setBuildings(buildings.map(b => b.id === editingId ? newBuilding : b));
      setEditingId(null);
    } else {
      setBuildings([...buildings, newBuilding]);
    }

    // Reset do następnego budynku
    setCurrentName('');
    setCurrentPolygon([]);
    setCurrentEntrance(null);
    setStep('name');
  };

  const handleEdit = (building: BuildingMapping) => {
    setEditingId(building.id);
    setCurrentName(building.name);
    setCurrentPolygon(building.polygon);
    setCurrentEntrance(building.entrance);
    setStep('confirm');
  };

  const handleDelete = (id: string) => {
    if (confirm('Usunąć ten budynek?')) {
      setBuildings(buildings.filter(b => b.id !== id));
    }
  };

  const handleFinish = () => {
    if (buildings.length === 0) {
      alert('Dodaj przynajmniej jeden budynek');
      return;
    }
    onComplete(buildings);
  };

  const handleReset = () => {
    setCurrentName('');
    setCurrentPolygon([]);
    setCurrentEntrance(null);
    setStep('name');
    setEditingId(null);
  };

  return (
    <>
      <MapClickHandler />

      {/* Renderuj wszystkie zapisane budynki */}
      {buildings.map(building => (
        <div key={building.id}>
          <Polygon
            positions={building.polygon}
            pathOptions={{
              color: 'blue',
              fillColor: 'blue',
              fillOpacity: 0.3,
            }}
          />
          <Marker position={building.entrance} icon={entranceIcon} />
        </div>
      ))}

      {/* Renderuj aktualnie tworzony budynek */}
      {currentPolygon.length >= 3 && (
        <Polygon
          positions={currentPolygon}
          pathOptions={{
            color: 'red',
            fillColor: 'red',
            fillOpacity: 0.3,
            dashArray: step === 'confirm' ? undefined : '5, 5',
          }}
        />
      )}

      {currentEntrance && (
        <Marker position={currentEntrance} icon={entranceIcon} />
      )}

      {/* Panel kontrolny - będzie renderowany w page.tsx */}
    </>
  );
}

// Komponent panelu kontrolnego
export function BuildingMappingControls({
  step,
  currentName,
  currentPolygon,
  currentEntrance,
  buildings,
  onNameChange,
  onNameSubmit,
  onPolygonComplete,
  onEntranceComplete,
  onConfirm,
  onEdit,
  onDelete,
  onFinish,
  onReset,
  editingId,
}: {
  step: Step;
  currentName: string;
  currentPolygon: [number, number][];
  currentEntrance: [number, number] | null;
  buildings: BuildingMapping[];
  onNameChange: (name: string) => void;
  onNameSubmit: () => void;
  onPolygonComplete: () => void;
  onEntranceComplete: () => void;
  onConfirm: () => void;
  onEdit: (building: BuildingMapping) => void;
  onDelete: (id: string) => void;
  onFinish: () => void;
  onReset: () => void;
  editingId: string | null;
}) {
  return (
    <div className="bg-white border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">
        {editingId ? 'Edycja budynku' : 'Mapowanie budynków'}
      </h3>

      {/* Krok 1: Nazwa */}
      {step === 'name' && (
        <div className="space-y-3">
          <div className="text-sm text-gray-600">Krok 1/3: Podaj nazwę budynku</div>
          <input
            type="text"
            value={currentName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="np. W-3, W-7, W-12..."
            className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && onNameSubmit()}
          />
          <button
            onClick={onNameSubmit}
            className="w-full px-4 py-2 bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            Dalej →
          </button>
        </div>
      )}

      {/* Krok 2: Polygon */}
      {step === 'polygon' && (
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            Krok 2/3: Zaznacz kontur budynku <strong>{currentName}</strong>
          </div>
          <div className="text-xs text-gray-500">
            Kliknij na mapę, aby dodać punkty konturu budynku ({currentPolygon.length} punktów)
          </div>
          <div className="flex gap-2">
            <button
              onClick={onPolygonComplete}
              disabled={currentPolygon.length < 3}
              className="flex-1 px-4 py-2 bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Dalej →
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm hover:bg-gray-300"
            >
              Anuluj
            </button>
          </div>
          {currentPolygon.length > 0 && (
            <div className="text-xs text-gray-500 max-h-24 overflow-y-auto">
              {currentPolygon.map((pt, i) => (
                <div key={i}>
                  {i + 1}. {pt[0].toFixed(6)}, {pt[1].toFixed(6)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Krok 3: Wejście */}
      {step === 'entrance' && (
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            Krok 3/3: Zaznacz wejście do budynku <strong>{currentName}</strong>
          </div>
          <div className="text-xs text-gray-500">
            Kliknij na mapę, aby zaznaczyć główne wejście
          </div>
          {currentEntrance && (
            <div className="text-xs text-green-600">
              ✓ Wejście: {currentEntrance[0].toFixed(6)}, {currentEntrance[1].toFixed(6)}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={onEntranceComplete}
              disabled={!currentEntrance}
              className="flex-1 px-4 py-2 bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Dalej →
            </button>
            <button
              onClick={() => {
                setCurrentEntrance(null);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm hover:bg-gray-300"
            >
              Wyczyść
            </button>
          </div>
        </div>
      )}

      {/* Krok 4: Potwierdzenie */}
      {step === 'confirm' && (
        <div className="space-y-3">
          <div className="text-sm text-gray-600">Czy wszystko się zgadza?</div>
          <div className="border border-gray-200 p-3 text-sm">
            <div className="font-medium">{currentName}</div>
            <div className="text-xs text-gray-600 mt-1">
              Punkty konturu: {currentPolygon.length}
            </div>
            {currentEntrance && (
              <div className="text-xs text-gray-600">
                Wejście: {currentEntrance[0].toFixed(6)}, {currentEntrance[1].toFixed(6)}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-green-600 text-white text-sm hover:bg-green-700"
            >
              ✓ Zapisz
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2 bg-yellow-500 text-white text-sm hover:bg-yellow-600"
            >
              Popraw
            </button>
          </div>
        </div>
      )}

      {/* Lista budynków */}
      {buildings.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-gray-600">
              Zapisane budynki ({buildings.length})
            </div>
            <button
              onClick={onFinish}
              className="text-xs bg-green-600 text-white px-3 py-1 hover:bg-green-700"
            >
              Zakończ i kopiuj dane
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {buildings.map(building => (
              <div key={building.id} className="border border-gray-200 p-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{building.name}</div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEdit(building)}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Edytuj
                    </button>
                    <button
                      onClick={() => onDelete(building.id)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Usuń
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Centrum: {building.center[0].toFixed(6)}, {building.center[1].toFixed(6)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export type { Step };
