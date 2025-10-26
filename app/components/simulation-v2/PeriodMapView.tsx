'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useTheme } from 'next-themes';
import L from 'leaflet';
import { useTTXStoreV2 } from '@/lib/stores/ttxStoreV2';
import { AnimatedCounter } from './AnimatedCounter';
import type { PersonaResponse } from '@/lib/types/ttx';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LOCATION_COLORS: Record<PersonaResponse['location'], string> = {
  home: '#6b7280',         // gray
  evacuating: '#f59e0b',   // orange
  shelter: '#10b981',      // green
  with_family: '#3b82f6',  // blue
  helping_others: '#8b5cf6' // purple
};

const SENTIMENT_COLORS: Record<PersonaResponse['sentiment'], string> = {
  calm: '#10b981',         // green
  concerned: '#eab308',    // yellow
  anxious: '#f59e0b',      // orange
  panicked: '#ef4444',     // red
  skeptical: '#a855f7',    // purple
  defiant: '#ec4899'       // pink
};

// Animated marker component
function AnimatedPersonaMarker({ persona, onClick }: { persona: PersonaResponse; onClick: () => void }) {
  const [position, setPosition] = useState<[number, number]>([persona.position.lat, persona.position.lng]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const newPos: [number, number] = [persona.position.lat, persona.position.lng];

    // Check if position changed
    if (position[0] !== newPos[0] || position[1] !== newPos[1]) {
      setIsAnimating(true);

      // Smooth transition
      const startTime = Date.now();
      const duration = 1000; // 1 second animation
      const startPos = [...position] as [number, number];

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease in-out cubic
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        const currentPos: [number, number] = [
          startPos[0] + (newPos[0] - startPos[0]) * eased,
          startPos[1] + (newPos[1] - startPos[1]) * eased
        ];

        setPosition(currentPos);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };

      animate();
    }
  }, [persona.position.lat, persona.position.lng]);

  const sentimentColor = SENTIMENT_COLORS[persona.sentiment];

  const icon = L.divIcon({
    className: 'custom-persona-marker',
    html: `
      <div style="
        position: relative;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <!-- Sentiment ring (outer) -->
        <div style="
          position: absolute;
          width: 20px;
          height: 20px;
          border: 2px solid ${sentimentColor};
          border-radius: 50%;
          opacity: 0.8;
          box-shadow: 0 0 8px ${sentimentColor}50;
        "></div>
        <!-- Location dot (inner) -->
        <div style="
          width: 12px;
          height: 12px;
          background-color: ${LOCATION_COLORS[persona.location]};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          transition: all 0.3s ease;
          cursor: pointer;
          ${isAnimating ? 'transform: scale(1.3);' : ''}
        "></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{ click: onClick }}
    >
      <Popup>
        <div className="text-sm">
          <strong>{persona.personaName}</strong>
          <br />
          <span className="text-xs text-muted-foreground">{persona.personaType}</span>
          <br />
          <span className="capitalize">{persona.location.replace('_', ' ')}</span>
          <br />
          <span className="text-xs italic">{persona.sentiment}</span>
        </div>
      </Popup>
    </Marker>
  );
}


// Component to handle theme-based tile layer switching
function ThemeTileLayer() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use resolvedTheme to handle 'system' theme
  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  return (
    <TileLayer
      key={isDark ? 'dark' : 'light'}
      attribution={isDark
        ? '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }
      url={isDark
        ? 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      }
    />
  );
}

export function PeriodMapView() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const scenario = useTTXStoreV2((state) => state.scenario);
  const currentPeriod = useTTXStoreV2((state) => state.currentPeriod);
  const setSelectedPersona = useTTXStoreV2((state) => state.setSelectedPersona);

  if (!isClient || !scenario) {
    return <div className="w-full h-full bg-accent animate-pulse" />;
  }

  const currentResult = scenario.periodResults[currentPeriod - 1];
  const personas = currentResult.personaResponses;

  // Count by location status
  const locationCounts = personas.reduce((acc, p) => {
    acc[p.location] = (acc[p.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[25.7617, -80.1918]}
        zoom={11}
        className="w-full h-full"
        zoomControl={true}
      >

        <ThemeTileLayer />

        {/* Hurricane landfall marker */}
        <Marker position={[25.8, -80.2]}>
          <Popup>
            <div className="text-sm">
              <strong className="text-red-600">Projected Landfall</strong>
              <br />
              Category 4 Hurricane
              <br />
              Time: {currentResult.operationalPeriod.startTime}
            </div>
          </Popup>
        </Marker>

        {/* Persona markers with animations */}
        {personas.map((persona) => (
          <AnimatedPersonaMarker
            key={persona.personaId}
            persona={persona}
            onClick={() => setSelectedPersona(persona.personaId)}
          />
        ))}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-background/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-border text-xs z-10">
        <div className="font-semibold mb-2">Persona Status</div>
        {Object.entries(LOCATION_COLORS).map(([status, color]) => {
          const count = locationCounts[status as PersonaResponse['location']] || 0;
          if (count === 0) return null;

          return (
            <div key={status} className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: color }}
              />
              <span className="capitalize text-muted-foreground flex-1">
                {status.replace('_', ' ')}
              </span>
              <span className="font-mono font-semibold">
                <AnimatedCounter value={count} duration={0.5} />
              </span>
            </div>
          );
        })}
        <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
          Total: <AnimatedCounter value={personas.length} duration={0.5} /> personas
        </div>
      </div>
    </div>
  );
}
