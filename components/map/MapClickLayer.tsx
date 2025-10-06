"use client";

import { useMapEvents, Polygon, Marker } from 'react-leaflet';
import L from 'leaflet';
import { BuildingMapping } from './BuildingMappingWizard';

interface MapClickLayerProps {
  onMapClick: (point: [number, number]) => void;
  currentPolygon: [number, number][];
  currentEntrance: [number, number] | null;
  buildings: BuildingMapping[];
  isDrawingPolygon: boolean;
  isDrawingEntrance: boolean;
}

const entranceIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export function MapClickLayer({
  onMapClick,
  currentPolygon,
  currentEntrance,
  buildings,
  isDrawingPolygon,
  isDrawingEntrance,
}: MapClickLayerProps) {
  useMapEvents({
    click: (e) => {
      if (isDrawingPolygon || isDrawingEntrance) {
        onMapClick([e.latlng.lat, e.latlng.lng]);
      }
    },
  });

  return (
    <>
      {/* Renderuj zapisane budynki */}
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

      {/* Renderuj aktualnie tworzony polygon */}
      {currentPolygon.length >= 3 && (
        <Polygon
          positions={currentPolygon}
          pathOptions={{
            color: 'red',
            fillColor: 'red',
            fillOpacity: 0.3,
            dashArray: '5, 5',
          }}
        />
      )}

      {/* Renderuj wejście */}
      {currentEntrance && (
        <Marker position={currentEntrance} icon={entranceIcon} />
      )}
    </>
  );
}
