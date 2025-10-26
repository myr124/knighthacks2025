'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { TimelineControls } from '@/app/components/simulation/TimelineControls';
import { ActionControlPanel } from '@/app/components/simulation/ActionControlPanel';
import { SituationalAwarenessPanel } from '@/app/components/simulation/SituationalAwarenessPanel';
import { EventTickerFeed } from '@/app/components/simulation/EventTickerFeed';
import { AgentInspectionPanel } from '@/app/components/simulation/AgentInspectionPanel';
import { useSimulationStore } from '@/lib/stores/simulationStore';
import { ThemeToggle } from '@/app/components/ThemeToggle';

// Dynamically import the map to avoid SSR issues with Leaflet
const GISMapView = dynamic(
  () => import('@/app/components/simulation/GISMapView').then(mod => ({ default: mod.GISMapView })),
  { ssr: false, loading: () => <div className="w-full h-full bg-accent animate-pulse" /> }
);

export default function SimulationPage() {
  const isPlaying = useSimulationStore((state) => state.isPlaying);
  const tick = useSimulationStore((state) => state.tick);
  const selectedAgentId = useSimulationStore((state) => state.selectedAgentId);
  const speed = useSimulationStore((state) => state.speed);

  // Simulation loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      tick();
    }, 1000 / speed); // Faster intervals for higher speeds

    return () => clearInterval(interval);
  }, [isPlaying, tick, speed]);

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden relative">
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Timeline Controls - Top Bar */}
      <TimelineControls />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar - Action Control Panel */}
        <ActionControlPanel />

        {/* Center - Map View */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative">
            <GISMapView />

            {/* Agent Inspection Panel - Overlays on map when agent selected */}
            {selectedAgentId && <AgentInspectionPanel />}
          </div>

          {/* Bottom - Event Feed */}
          <div className="h-64 border-t">
            <EventTickerFeed />
          </div>
        </div>

        {/* Right Sidebar - Situational Awareness */}
        <SituationalAwarenessPanel />
      </div>
    </div>
  );
}
