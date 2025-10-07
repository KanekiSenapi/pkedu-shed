"use client";

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

interface RoutingLayerProps {
  start: [number, number];
  end: [number, number];
}

export function RoutingLayer({ start, end }: RoutingLayerProps) {
  const map = useMap();
  const routingControlRef = useRef<L.Routing.Control | null>(null);

  useEffect(() => {
    if (!map) return;

    // Cleanup previous routing control if exists
    if (routingControlRef.current) {
      try {
        if (map.hasLayer(routingControlRef.current as any)) {
          map.removeControl(routingControlRef.current);
        }
      } catch (error) {
        console.warn('Failed to remove previous routing control:', error);
      }
      routingControlRef.current = null;
    }

    try {
      const routingControl = L.Routing.control({
        waypoints: [
          L.latLng(start[0], start[1]),
          L.latLng(end[0], end[1])
        ],
        routeWhileDragging: false,
        addWaypoints: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
        lineOptions: {
          styles: [{ color: '#3b82f6', weight: 4, opacity: 0.7 }],
          extendToWaypoints: true,
          missingRouteTolerance: 0
        },
        show: false, // Hide turn-by-turn instructions panel
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: 'foot' // Walking route
        }),
      } as any);

      routingControl.addTo(map);
      routingControlRef.current = routingControl;
    } catch (error) {
      console.error('Failed to create routing control:', error);
    }

    return () => {
      if (routingControlRef.current && map) {
        try {
          // Check if map container still exists
          const container = map.getContainer();
          if (container && map.hasLayer(routingControlRef.current as any)) {
            map.removeControl(routingControlRef.current);
          }
        } catch (error) {
          // Silently ignore cleanup errors
        }
        routingControlRef.current = null;
      }
    };
  }, [map, start, end]);

  return null;
}
