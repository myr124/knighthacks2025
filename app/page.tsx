"use client";
import Sidebar from "./components/Sidebar";
import MetricsPanel from "./components/MetricsPanel";
import Globe from "./components/Globe";
import ChatBox from "./components/ChatBox";
import Header from "./components/Header";
import React from "react";

export default function Home() {
  const [selectedPlan, setSelectedPlan] = React.useState<any>(null);

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
        <Globe targetLocation={null} />
        <ChatBox selectedPlan={selectedPlan} />
      </div>
      <div className="shrink-0">
        <MetricsPanel {...metrics} />
      </div>
    </div>
  );
}
