'use client'
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

const MetricsPanel: React.FC = () => {
  const [hazardCategory, setHazardCategory] = React.useState(0);
  const [agentCount, setAgentCount] = React.useState(0);
  
  return (
    <aside className="h-screen w-80 bg-black text-white border-l border-gray-800 flex flex-col px-5 py-5 gap-5">
      {/* Mission Status */}
      <span className="text-gray-300 text-md tracking-wide">Emergency Config</span>
      <Card className="bg-transparent border border-gray-800/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm tracking-wide text-gray-200">
            HURRICANE STATUS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-red-400">Hazard Category</span>
              <input
                type="number"
                min={0}
                max={5}
                className="bg-gray-900 text-gray-200 px-2 py-1 rounded w-16 border border-gray-700"
                value={hazardCategory}
                onChange={e => setHazardCategory(Number(e.target.value))}
              />
            </div>
            <div className="relative w-full h-2 rounded-full bg-gray-800">
              <div
              className="absolute top-0 left-0 h-full rounded-full"
              style={{
                width: `${(hazardCategory / 5) * 100}%`,
                background:
                hazardCategory <= 1
                  ? "#65a30d" // dark green
                  : hazardCategory === 2
                  ? "#84cc16" // light green
                  : hazardCategory === 3
                  ? "#facc15" // yellow
                  : hazardCategory === 4
                  ? "#f97316" // orange
                  : "#dc2626", // red
                transition: "width 0.2s cubic-bezier(.7,2,.8,1), background 0.15s linear",
              }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300">TARGET AREA</span>
              <input
                type="text"
                className="bg-gray-900 text-gray-200 px-2 py-1 rounded w-32 border border-gray-700"
                defaultValue="Orlando, FL"
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300">WIND SPEED</span>
              <input
                type="number"
                className="bg-gray-900 text-red-400 px-2 py-1 rounded w-24 border border-gray-700"
                defaultValue="CRITICAL"
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300">TOTAL DAYS</span>
              <input
                type=""
                className="bg-gray-900 text-gray-200 px-2 py-1 rounded w-24 border border-gray-700"
                defaultValue="10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Activity */}
      <Card className="bg-transparent border border-gray-800/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm tracking-wide text-gray-200">
            AGENT STATUS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300">AGENT COUNT</span>
              <input
                type="number"
                className="bg-gray-900 text-gray-200 px-2 py-1 rounded w-24 border border-gray-700"
                value={agentCount}
                onChange={e => setAgentCount(Number(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Analysis Input helper */}
      <div className="mt-auto text-xs text-gray-400 space-y-1">
      <Separator className="bg-gray-800" />

        <div>Enter emergency configuration to simulate disaster response</div>
        <div>{agentCount} Agents loaded</div>
      </div>
    </aside>
  );
};

export default MetricsPanel;
