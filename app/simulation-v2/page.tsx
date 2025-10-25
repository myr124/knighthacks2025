"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { ConsolidatedHeader } from "@/app/components/simulation-v2/ConsolidatedHeader";
import { TabbedSidePanel } from "@/app/components/simulation-v2/TabbedSidePanel";
import { PersonaDetailDialog } from "@/app/components/simulation-v2/PersonaDetailDialog";
import { useTTXStoreV2 } from "@/lib/stores/ttxStoreV2";
import { InjectsAndEOCsFeed } from "@/app/components/simulation-v2/InjectsAndEOCsFeed";
import { EventDetailDialog } from "@/app/components/simulation-v2/EventDetailDialog";

import { SituationSummaryPanel } from '@/app/components/simulation-v2/SituationSummaryPanel';

// Dynamically import the map to avoid SSR issues
const PeriodMapView = dynamic(
  () =>
    import("@/app/components/simulation-v2/PeriodMapView").then((mod) => ({
      default: mod.PeriodMapView,
    })),
  {
    ssr: false,
    loading: () => <div className="w-full h-full bg-accent animate-pulse" />,
  }
);

export default function SimulationV2Page() {
  const scenario = useTTXStoreV2((state) => state.scenario);

  if (!scenario) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Scenario...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Consolidated Header */}
      <ConsolidatedHeader />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        <SituationSummaryPanel />
        {/* Center: Map + Event Feed */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Map */}
          <div className="flex-1 relative border rounded-xl overflow-hidden">
            <PeriodMapView />
          </div>

          {/* Bottom: Injects & Actions Feed */}
          <div className="h-64 mt-2 bg-background">
            <InjectsAndEOCsFeed />
          </div>
        </div>

        {/* Right: Tabbed Side Panel */}
        <TabbedSidePanel />
      </div>

      {/* Dialogs */}
      <PersonaDetailDialog />
      <EventDetailDialog />
    </div>
  );
}
