import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { LatLngExpression } from 'leaflet';
import { BusData } from '../services/websocketService';
import { cn } from '@/lib/utils';
import axios from 'axios';

// Custom bus icon
const busIcon = new L.Icon({
  iconUrl: '/bus-icon.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface BusMapProps {
  buses: BusData[];
  selectedBus: BusData | null;
  onSelectBus: (bus: BusData) => void;
  className?: string;
}

function AutoCenter({ buses, selectedBus }: { buses: BusData[]; selectedBus: BusData | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedBus && selectedBus.lat && selectedBus.lng) {
      map.setView([selectedBus.lat, selectedBus.lng], 15);
    } else if (buses.length > 0) {
      const validPositions = buses.filter(bus => bus.lat && bus.lng).map(bus => [bus.lat, bus.lng] as [number, number]);
      if (validPositions.length > 0) {
        const bounds = L.latLngBounds(validPositions);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    }
  }, [map, buses, selectedBus]);

  return null;
}

const BusMap: React.FC<BusMapProps> = ({ buses, selectedBus, onSelectBus, className }) => {
  const defaultCenter: LatLngExpression = [26.44, 91.44];
  const defaultZoom = 13;
  const [routePath, setRoutePath] = useState<LatLngExpression[]>([]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (selectedBus && selectedBus.from_lat && selectedBus.from_lng && selectedBus.to_lat && selectedBus.to_lng) {
        try {
          const response = await axios.get('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
            headers: {
              Authorization: 'YOUR_OPENROUTESERVICE_API_KEY', // Replace with your API key
            },
            params: {
              api_key: 'YOUR_OPENROUTESERVICE_API_KEY',
              start: `${selectedBus.from_lng},${selectedBus.from_lat}`,
              end: `${selectedBus.to_lng},${selectedBus.to_lat}`,
            },
          });
          const coordinates = response.data.features[0].geometry.coordinates;
          setRoutePath(coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]));
        } catch (err) {
          console.error('Error fetching route:', err);
          setRoutePath([[selectedBus.from_lat, selectedBus.from_lng], [selectedBus.to_lat, selectedBus.to_lng]]);
        }
      } else {
        setRoutePath([]);
      }
    };
    fetchRoute();
  }, [selectedBus]);

  return (
    <div className={cn("w-full h-full rounded-2xl overflow-hidden shadow-lg", className)}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        className="z-10"
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />

        {buses
          .filter(bus => bus.lat && bus.lng)
          .map(bus => (
            <Marker
              key={bus.bus_number}
              position={[bus.lat, bus.lng]}
              icon={busIcon}
              eventHandlers={{ click: () => onSelectBus(bus) }}
            >
              <Popup>
                <div>
                  <h3 className="font-semibold">{bus.bus_number}</h3>
                  <p>Route: {bus.route_name || 'N/A'}</p>
                  <p>Last Update: {bus.lastUpdate || 'N/A'}</p>
                </div>
              </Popup>
            </Marker>
          ))}

        {routePath.length > 0 && (
          <Polyline positions={routePath} color="blue" weight={4} opacity={0.7} />
        )}

        {buses.length > 0 && <AutoCenter buses={buses} selectedBus={selectedBus} />}
      </MapContainer>
    </div>
  );
};

export default BusMap;
