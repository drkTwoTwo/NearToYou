
import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { BusData } from '../services/websocketService';
import { formatDistanceToNow } from 'date-fns';

interface BusMarkerProps {
  bus: BusData;
  color: string;
}

const BusMarker: React.FC<BusMarkerProps> = ({ bus, color }) => {
  // Create a custom marker icon with the bus ID
  const icon = useMemo(() => {
    return L.divIcon({
      className: 'custom-bus-marker',
      html: `
        <div class="bus-marker" style="background-color: ${color}">
          ${bus.id}
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }, [bus.id, color]);

  const lastUpdateText = bus.lastUpdate 
    ? formatDistanceToNow(new Date(bus.lastUpdate), { addSuffix: true })
    : 'Unknown';

  return (
    <Marker
      position={[bus.lat, bus.lng]}
      icon={icon}
      title={`Bus ${bus.id}`}
    >
      <Popup>
        <div className="text-sm font-medium">
          <div className="font-semibold mb-1">Bus {bus.id}</div>
          {bus.route && <div>Route: {bus.route}</div>}
          <div>Position: {bus.lat.toFixed(6)}, {bus.lng.toFixed(6)}</div>
          {bus.speed !== undefined && <div>Speed: {bus.speed} km/h</div>}
          {bus.heading !== undefined && <div>Heading: {bus.heading}°</div>}
          <div className="text-xs text-muted-foreground mt-1">Updated {lastUpdateText}</div>
        </div>
      </Popup>
    </Marker>
  );
};

export default React.memo(BusMarker);
