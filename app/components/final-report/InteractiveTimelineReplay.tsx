"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useTTXStoreV2 } from "@/lib/stores/ttxStoreV2";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

// Dynamically import map to avoid SSR issues
const PeriodMapView = dynamic(
  () =>
    import("@/app/components/simulation-v2/PeriodMapView").then((mod) => ({
      default: mod.PeriodMapView,
    })),
  {
    ssr: false,
    loading: () => <div className="w-full h-full bg-accent animate-pulse rounded-lg" />,
  }
);

const PHASE_COLORS = {
  planning: "bg-blue-500",
  preparation: "bg-yellow-500",
  response: "bg-red-500",
  recovery: "bg-green-500",
};

export function InteractiveTimelineReplay() {
  const scenario = useTTXStoreV2((state) => state.scenario);
  const currentPeriod = useTTXStoreV2((state) => state.currentPeriod);
  const setCurrentPeriod = useTTXStoreV2((state) => state.setCurrentPeriod);
  const [isPlaying, setIsPlaying] = useState(false);

  if (!scenario) return null;

  const currentResult = scenario.periodResults[currentPeriod - 1];
  const op = currentResult.operationalPeriod;

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      playTimeline();
    }
  };

  const playTimeline = () => {
    const interval = setInterval(() => {
      setCurrentPeriod((prev) => {
        if (prev >= scenario.periodResults.length) {
          setIsPlaying(false);
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 2000); // Advance every 2 seconds
  };

  const handleSliderChange = (value: number[]) => {
    setIsPlaying(false);
    setCurrentPeriod(value[0]);
  };

  const handlePrevious = () => {
    setIsPlaying(false);
    if (currentPeriod > 1) {
      setCurrentPeriod(currentPeriod - 1);
    }
  };

  const handleNext = () => {
    setIsPlaying(false);
    if (currentPeriod < scenario.periodResults.length) {
      setCurrentPeriod(currentPeriod + 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentPeriod(1);
  };

  // Get metrics for current period
  const metrics = {
    sheltered: currentResult.aggregates.locations.shelter,
    evacuating: currentResult.aggregates.locations.evacuating,
    atHome: currentResult.aggregates.locations.home,
    needAssistance: currentResult.aggregates.needingAssistance,
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-2">Interactive Timeline Replay</h3>
        <p className="text-muted-foreground">
          Replay the simulation to visualize cause and effect relationships
        </p>
      </div>

      {/* Map View */}
      <Card className="p-4">
        <div className="h-[500px] rounded-lg overflow-hidden border">
          <PeriodMapView />
        </div>
      </Card>

      {/* Timeline Controls */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Period Info */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Badge className={`${PHASE_COLORS[op.phase]} text-white`}>
                  {op.phase.charAt(0).toUpperCase() + op.phase.slice(1)}
                </Badge>
                <h4 className="font-semibold text-lg">Period {currentPeriod}</h4>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{op.label}</p>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                Reset
              </Button>
              <Button variant="outline" size="icon" onClick={handlePrevious}>
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                onClick={handlePlayPause}
                className="bg-primary"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button variant="outline" size="icon" onClick={handleNext}>
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Timeline Slider */}
          <div className="px-2">
            <Slider
              value={[currentPeriod]}
              min={1}
              max={scenario.periodResults.length}
              step={1}
              onValueChange={handleSliderChange}
              className="w-full"
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Period 1</span>
              <span>Period {scenario.periodResults.length}</span>
            </div>
          </div>

          {/* Live Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={`sheltered-${currentPeriod}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-green-50 dark:bg-green-950 p-4 rounded-lg text-center"
              >
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {metrics.sheltered}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">Sheltered</p>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={`evacuating-${currentPeriod}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg text-center"
              >
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {metrics.evacuating}
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  Evacuating
                </p>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={`home-${currentPeriod}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-gray-50 dark:bg-gray-950 p-4 rounded-lg text-center"
              >
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                  {metrics.atHome}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">At Home</p>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={`assistance-${currentPeriod}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-red-50 dark:bg-red-950 p-4 rounded-lg text-center"
              >
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {metrics.needAssistance}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  Need Assistance
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Events for Current Period */}
          <div className="grid grid-cols-2 gap-4">
            {/* Injects */}
            <div>
              <h5 className="font-semibold text-sm mb-2">Injects</h5>
              <div className="space-y-2">
                {currentResult.injects.length > 0 ? (
                  currentResult.injects.map((inject) => (
                    <div
                      key={inject.id}
                      className="bg-accent p-3 rounded text-sm"
                    >
                      <p className="font-medium">{inject.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {inject.time}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No injects</p>
                )}
              </div>
            </div>

            {/* EOC Actions */}
            <div>
              <h5 className="font-semibold text-sm mb-2">EOC Actions</h5>
              <div className="space-y-2">
                {currentResult.eocActions.length > 0 ? (
                  currentResult.eocActions.map((action) => (
                    <div
                      key={action.id}
                      className="bg-primary/10 p-3 rounded text-sm"
                    >
                      <p className="font-medium">{action.details}</p>
                      <p className="text-xs text-muted-foreground">
                        {action.time}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No actions</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
