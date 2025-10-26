"use client";
import Sidebar from "./components/Sidebar";
import MetricsPanel from "./components/MetricsPanel";
import Globe from "./components/Globe";
import type { GlobeRef } from "./components/Globe";
import ChatBox from "./components/ChatBox";
import Header from "./components/Header";
import React from "react";

export default function Home() {
  const [selectedPlan, setSelectedPlan] = React.useState<any>(null);
  const globeRef = React.useRef<GlobeRef>(null);

  // Expose globe to window for console testing
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // Use a getter function so it always returns the current ref value
      Object.defineProperty(window, 'globe', {
        get: () => globeRef.current,
        configurable: true
      });
      console.log('🌍 Globe API exposed to console! Try: globe.addPin(40.7128, -74.0060, "#ff0000", "NYC")');
    }
  }, []); // Empty dependency array - run once on mount

  // Helper to extract metrics from selectedPlan
  const getMetrics = (plan: any) => {
    if (!plan)
      return {
        hazardCategory: 0,
        targetArea: "",
        timeTillLandfall: 0,
        agentCount: 0,
      };
    return {
      hazardCategory: plan.severity ? Number(plan.severity) : 0,
      targetArea: plan.location || "",
      timeTillLandfall: plan.time || 0,
      agentCount: plan.population || 0,
    };
  };
  const metrics = getMetrics(selectedPlan);

  return (
    <div className="flex h-screen w-full bg-black overflow-hidden">
      <div className="shrink-0">
        <Sidebar
          selectedPlan={selectedPlan}
          setSelectedPlan={setSelectedPlan}
        />
      </div>
      <div className="flex-1 flex items-center justify-center relative">
        <Globe ref={globeRef} targetLocation={null} />
        <ChatBox selectedPlan={selectedPlan} />
      </div>
      <div className="shrink-0">
        <MetricsPanel {...metrics} />
      </div>
    </div>
  );
}
