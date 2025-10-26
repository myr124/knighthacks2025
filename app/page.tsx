'use client'
import Sidebar from "./components/Sidebar";
import MetricsPanel from "./components/MetricsPanel";
import Globe from "./components/Globe";
import ChatBox from "./components/ChatBox";
import Header from "./components/Header"
import React from 'react'

export default function Home() {
  const [selectedPlan, setSelectedPlan] = React.useState<any>(null);

  // Helper to extract metrics from selectedPlan
  const getMetrics = (plan: any) => {
    if (!plan) return { hazardCategory: 0, targetArea: "No Location", timeTillLandfall: 0, agentCount: 50 };
    const severityToCategory: Record<string, number> = {
      minor: 1,
      moderate: 2,
      major: 3,
      severe: 4,
      catastrophic: 5,
    };
    const hazardCategory = typeof plan.severity === 'string' ? (severityToCategory[plan.severity] ?? 0) : 0;
    const timeTillLandfall = plan.timeTillLandfall ?? plan.time ?? 0;
    return {
      hazardCategory,
      targetArea: plan.location || "",
      timeTillLandfall,
      agentCount: plan.population || 50,
    };
  };
  const metrics = getMetrics(selectedPlan);

  return (
    <div className="flex h-screen w-full bg-black overflow-hidden">
      <div className="shrink-0">
        <Sidebar selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} />
      </div>
      <div className="flex-1 flex items-center justify-center relative">
        <Globe targetLocation={null} />
        <ChatBox />
      </div>
      <div className="shrink-0">
        <MetricsPanel {...metrics} />
      </div>
    </div>
  );
}
