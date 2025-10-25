'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useSimulationStore } from '@/lib/stores/simulationStore';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const AGENT_COLORS = {
  at_home: '#6b7280',      // gray
  evacuating: '#f59e0b',   // orange
  sheltered: '#10b981',    // green
  stranded: '#ef4444'      // red
};

// Custom agent marker icons
function createAgentIcon(status: keyof typeof AGENT_COLORS) {
  return L.divIcon({
    className: 'custom-agent-marker',
    html: `<div style="
      width: 12px;
      height: 12px;
      background-color: ${AGENT_COLORS[status]};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

function MapController() {
  const map = useMap();

  useEffect(() => {
    // Set view to Miami-Dade area
    map.setView([25.7617, -80.1918], 11);
  }, [map]);

  return null;
}

export function GISMapView() {
  const agents = useSimulationStore((state) => state.agents);
  const selectAgent = useSimulationStore((state) => state.selectAgent);

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[25.7617, -80.1918]}
        zoom={11}
        className="w-full h-full"
        zoomControl={true}
      >
        <MapController />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Hurricane landfall marker */}
        <Marker position={[25.8, -80.2]}>
          <Popup>
            <div className="text-sm">
              <strong className="text-red-600">Projected Landfall</strong>
              <br />
              Category 4 Hurricane
              <br />
              ETA: 18 hours
            </div>
          </Popup>
        </Marker>

        {/* Agent markers */}
        {agents.map((agent) => (
          <Marker
            key={agent.id}
            position={agent.position}
            icon={createAgentIcon(agent.status)}
            eventHandlers={{
              click: () => selectAgent(agent.id)
            }}
          >
            <Popup>
              <div className="text-sm">
                <strong>{agent.name}</strong>
                <br />
                Status: <span className="capitalize">{agent.status.replace('_', ' ')}</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border text-xs z-[1000]">
        <div className="font-semibold mb-2">Agent Status</div>
        {Object.entries(AGENT_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: color }}
            />
            <span className="capitalize text-muted-foreground">{status.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
