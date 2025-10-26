"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { GripVertical } from "lucide-react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
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
  const initializeScenario = useTTXStoreV2((state) => state.initializeScenario);

  // Re-check for ADK data when component mounts
  useEffect(() => {
    // Only reinitialize if we detect new data in localStorage
    const storedData = typeof window !== 'undefined' ? localStorage.getItem('scenarioData') : null;

    if (storedData) {
      console.log('🔄 Simulation page detected ADK data in localStorage, reinitializing...');
      initializeScenario();
    } else if (!scenario) {
      // If no stored data and no scenario, initialize with default/API
      console.log('⚠️  No ADK data found, initializing with default scenario...');
      initializeScenario();
    }
  }, []);

  if (!scenario) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold mb-4">Loading Scenario...</h1>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className="h-screen flex flex-col bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Consolidated Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <ConsolidatedHeader />
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={30} minSize={30} maxSize={50}>
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-full"
            >
              <SituationSummaryPanel />
            </motion.div>
          </Panel>
          <PanelResizeHandle className="w-4 flex items-center justify-center">
            <GripVertical className="h-4 w-4 text-gray-400" />
          </PanelResizeHandle>
          <Panel defaultSize={75} minSize={25}>
            {/* Center: Map + Event Feed */}
            <div className="flex-1 flex flex-col overflow-hidden h-full">
              {/* Map */}
              <motion.div
                className="flex-1 relative border rounded-xl overflow-hidden"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <PeriodMapView />
              </motion.div>

              {/* Bottom: Injects & Actions Feed */}
              <motion.div
                className="h-64 mt-2 bg-background"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <InjectsAndEOCsFeed />
              </motion.div>
            </div>
          </Panel>
        </PanelGroup>
        {/* Right: Tabbed Side Panel */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <TabbedSidePanel />
        </motion.div>
      </div>

      {/* Dialogs */}
      <PersonaDetailDialog />
      <EventDetailDialog />
    </motion.div>
  );
}
