"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

const StatRow = ({
  label,
  value,
  colorClass = "text-foreground",
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  colorClass?: string;
}) => (
  <div className="flex items-center justify-between text-xs">
    <span className={colorClass}>{label}</span>
    <span className="text-muted-foreground">{value}</span>
  </div>
);

interface MetricsPanelProps {
  hazardCategory: number;
  targetArea: string;
  timeTillLandfall: number;
  agentCount: number;
}

const hazardColors = [
  "#65a30d", // 1 - dark green
  "#84cc16", // 2 - light green
  "#facc15", // 3 - yellow
  "#f97316", // 4 - orange
  "#dc2626", // 5 - red
];

const MetricsPanel: React.FC<MetricsPanelProps> = ({
  hazardCategory,
  targetArea,
  timeTillLandfall,
}) => {
  const [agentCount, setAgentCount] = React.useState(0);

  const hazardColor =
    hazardColors[
      Math.max(0, Math.min(hazardCategory - 1, hazardColors.length - 1))
    ];

  return (
    <aside className="h-screen w-80 bg-background text-foreground border-l border-border flex flex-col px-5 py-5 gap-5">
      {/* Mission Status */}
      <span className="text-foreground text-md tracking-wide">
        Simulation Config
      </span>
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm tracking-wide text-foreground">
            HURRICANE STATUS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <StatRow label="HAZARD CATEGORY" value={hazardCategory} />
            <div className="relative w-full h-2 rounded-full bg-muted">
              <div
                className="absolute top-0 left-0 h-full rounded-full"
                style={{
                  width: `${(hazardCategory / 5) * 100}%`,
                  background: hazardColor,
                  transition:
                    "width 0.2s cubic-bezier(.7,2,.8,1), background 0.15s linear",
                }}
              />
            </div>
            <StatRow label="TARGET AREA" value={targetArea} />
            <StatRow label="TIME TILL LANDFALL" value={timeTillLandfall} />
          </div>
        </CardContent>
      </Card>

      {/* Agent Activity */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm tracking-wide text-foreground">
            AGENT STATUS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <StatRow label="AGENT COUNT" value={ agentCount } />
          </div>
        </CardContent>
      </Card>

      {/* Analysis Input helper */}
      <div className="mt-auto text-xs text-muted-foreground space-y-1">
        <Separator className="bg-border" />
        <div>{agentCount} Agents loaded</div>
      </div>
    </aside>
  );
};

export default MetricsPanel;
