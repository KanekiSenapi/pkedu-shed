"use client";

import { useEffect, ReactNode } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Building } from '@/lib/campus-data';

// Fix dla ikon Leaflet w Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface InteractiveMapProps {
  buildings: Building[];
  selectedBuilding?: Building | null;
  userLocation?: { lat: number; lng: number } | null;
  onBuildingClick?: (building: Building) => void;
  children?: ReactNode;
}

// Komponent do centrowania mapy
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 17);
  }, [center, map]);
  return null;
}

export function InteractiveMap({
  buildings,
  selectedBuilding,
  userLocation,
  onBuildingClick,
  children,
}: InteractiveMapProps) {
  // Ikona dla budynków z salami
  const buildingIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  // Ikona dla wybranego budynku
  const selectedIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  // Ikona dla budynków bez sal
  const otherBuildingIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  // Ikona dla lokalizacji użytkownika
  const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const center: [number, number] = selectedBuilding
    ? [selectedBuilding.lat, selectedBuilding.lng]
    : userLocation
    ? [userLocation.lat, userLocation.lng]
    : [50.0682, 19.9187];

  return (
    <MapContainer
      center={center}
      zoom={17}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController center={center} />

      {/* Markery budynków */}
      {buildings.map((building) => {
        const isSelected = selectedBuilding?.id === building.id;
        const hasRooms = building.rooms.length > 0;

        return (
          <Marker
            key={building.id}
            position={[building.lat, building.lng]}
            icon={isSelected ? selectedIcon : hasRooms ? buildingIcon : otherBuildingIcon}
            eventHandlers={{
              click: () => onBuildingClick?.(building),
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-bold">{building.shortName}</div>
                <div className="text-xs text-gray-600 mt-1">{building.name}</div>
                {building.description && (
                  <div className="text-xs text-gray-500 mt-1">{building.description}</div>
                )}
                {hasRooms && (
                  <div className="mt-2">
                    <div className="text-xs font-medium text-gray-700">Sale:</div>
                    <div className="text-xs text-gray-600">{building.rooms.join(', ')}</div>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Lokalizacja użytkownika */}
      {userLocation && (
        <>
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div className="text-sm font-medium">Twoja lokalizacja</div>
            </Popup>
          </Marker>
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={50}
            pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.2 }}
          />
        </>
      )}

      {/* Dodatkowe warstwy (np. polygon editor) */}
      {children}
    </MapContainer>
  );
}
