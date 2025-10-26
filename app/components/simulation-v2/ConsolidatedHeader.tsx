"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Home, RefreshCw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTTXStoreV2 } from "@/lib/stores/ttxStoreV2";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { AnimatedCounter } from "./AnimatedCounter";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PHASE_COLORS = {
  planning: "bg-blue-500",
  preparation: "bg-yellow-500",
  response: "bg-red-500",
  recovery: "bg-green-500",
};

export function ConsolidatedHeader() {
  const router = useRouter();
  const scenario = useTTXStoreV2((state) => state.scenario);
  const currentPeriod = useTTXStoreV2((state) => state.currentPeriod);
  const nextPeriod = useTTXStoreV2((state) => state.nextPeriod);
  const previousPeriod = useTTXStoreV2((state) => state.previousPeriod);
  const isGenerating = useTTXStoreV2((state) => state.isGenerating);
  const generateScenario = useTTXStoreV2((state) => state.generateScenario);

  if (!scenario) return null;

  const isLastPeriod = currentPeriod === scenario.periodResults.length;

  const currentResult = scenario.periodResults[currentPeriod - 1];

  // Safety check: if currentResult is undefined, return null or show loading
  if (!currentResult || !currentResult.operationalPeriod) {
    return (
      <div className="bg-background/95 backdrop-blur-sm border-b px-6 py-3">
        <p className="text-sm text-muted-foreground">Loading period data...</p>
      </div>
    );
  }

  const op = currentResult.operationalPeriod;

  // Parse time string (e.g., "T-120h" or "T+24h")
  const parseTimeString = (timeStr: string): number => {
    const match = timeStr.match(/T([+-])(\d+)h/);
    if (!match) return 0;
    const sign = match[1] === "+" ? 1 : -1;
    const hours = parseInt(match[2]);
    return sign * hours;
  };

  const hoursToLandfall = parseTimeString(op.startTime);

  // Calculate simulation date
  const landfallDate = new Date();
  landfallDate.setDate(landfallDate.getDate() + 5);
  landfallDate.setHours(12, 0, 0, 0);

  const simulationDate = new Date(landfallDate);
  simulationDate.setHours(simulationDate.getHours() + hoursToLandfall);

  // Determine color based on urgency
  const getUrgencyColor = () => {
    if (hoursToLandfall >= 0)
      return { dot: "bg-blue-500", text: "text-blue-600" };
    if (hoursToLandfall >= -24)
      return { dot: "bg-red-500", text: "text-red-600" };
    if (hoursToLandfall >= -48)
      return { dot: "bg-orange-500", text: "text-orange-600" };
    return { dot: "bg-yellow-500", text: "text-yellow-600" };
  };

  const urgencyColors = getUrgencyColor();

  return (
    <div className="bg-background/95 backdrop-blur-sm border-b">
      {/* Main Header Row */}
      <div className="px-6 py-3 flex items-center justify-between">
        {/* Left: Title + Navigation */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <Home className="h-4 w-4" />
            </Button>
          </Link>

          {/* <div className="border-l pl-4">
            <h1 className="font-semibold text-lg">{scenario.ttxScript.name}</h1>
            <p className="text-xs text-muted-foreground">{op.label}</p>
          </div> */}

          <Badge className={`${PHASE_COLORS[op.phase]} text-white`}>
            {op.phase.charAt(0).toUpperCase() + op.phase.slice(1)}
          </Badge>
        </div>

        {/* Right: Time Info + Controls */}
        <div className="flex items-center gap-6">
          {/* Simulation Time */}
          <div className="text-sm">
            <span className="text-muted-foreground">Time:</span>
            <span className="ml-2 font-mono font-medium">
              {simulationDate.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* Time to Landfall */}
          <div className="flex items-center gap-2 text-sm">
            <div
              className={`w-2 h-2 rounded-full animate-pulse ${urgencyColors.dot}`}
            />
            <span className="text-muted-foreground">
              {hoursToLandfall >= 0 ? "Since Landfall:" : "To Landfall:"}
            </span>
            <span className={`font-mono font-medium ${urgencyColors.text}`}>
              {hoursToLandfall >= 0
                ? `T+${hoursToLandfall}h`
                : `T${hoursToLandfall}h`}
            </span>
          </div>

          {/* Period Navigation */}
          <div className="flex items-center gap-2 border-l pl-6">
            <Button
              size="sm"
              variant="outline"
              onClick={previousPeriod}
              disabled={currentPeriod === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="px-3 py-1 bg-accent rounded text-sm font-medium min-w-[80px] text-center">
              <AnimatedCounter value={currentPeriod} duration={0.3} /> / {scenario.periodResults.length}
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={nextPeriod}
              disabled={currentPeriod === scenario.periodResults.length}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Generate Report Button - Only on last period */}
          {isLastPeriod && (
            <Button
              size="sm"
              onClick={() => router.push("/final-report")}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <FileText className="h-3 w-3 mr-2" />
              Generate Report
            </Button>
          )}

          {/* Re-run Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateScenario({})}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-2" />
                Re-run
              </>
            )}
          </Button>

          <ThemeToggle />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 pb-2">
        <div className="flex gap-0.5">
          {scenario.periodResults.map((_, index) => {
            const periodNum = index + 1;
            const isActive = periodNum === currentPeriod;
            const isPast = periodNum < currentPeriod;

            return (
              <motion.div
                key={periodNum}
                className={`flex-1 h-1 ${
                  isActive
                    ? "bg-primary"
                    : isPast
                    ? "bg-primary/50"
                    : "bg-accent"
                }`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.05,
                  ease: "easeOut",
                }}
                style={{ originX: 0 }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
