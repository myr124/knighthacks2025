'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTTXStoreV2 } from '@/lib/stores/ttxStoreV2';

export function PeriodTimelineHeader() {
  const scenario = useTTXStoreV2((state) => state.scenario);
  const currentPeriod = useTTXStoreV2((state) => state.currentPeriod);
  const nextPeriod = useTTXStoreV2((state) => state.nextPeriod);
  const previousPeriod = useTTXStoreV2((state) => state.previousPeriod);

  if (!scenario) return null;

  const currentResult = scenario.periodResults[currentPeriod - 1];
  const op = currentResult.operationalPeriod;

  // Parse time string (e.g., "T-120h" or "T+24h")
  const parseTimeString = (timeStr: string): number => {
    const match = timeStr.match(/T([+-])(\d+)h/);
    if (!match) return 0;
    const sign = match[1] === '+' ? 1 : -1;
    const hours = parseInt(match[2]);
    return sign * hours;
  };

  const hoursToLandfall = parseTimeString(op.startTime);

  // Calculate simulation date (assuming landfall is 5 days from now)
  const landfallDate = new Date();
  landfallDate.setDate(landfallDate.getDate() + 5);
  landfallDate.setHours(12, 0, 0, 0); // Set to noon

  const simulationDate = new Date(landfallDate);
  simulationDate.setHours(simulationDate.getHours() + hoursToLandfall);

  // Determine color based on urgency
  const getUrgencyColor = () => {
    if (hoursToLandfall >= 0) return { dot: 'bg-blue-500', text: 'text-blue-600' }; // Post-landfall
    if (hoursToLandfall >= -24) return { dot: 'bg-red-500', text: 'text-red-600' }; // 0-24h before
    if (hoursToLandfall >= -48) return { dot: 'bg-orange-500', text: 'text-orange-600' }; // 24-48h before
    return { dot: 'bg-yellow-500', text: 'text-yellow-600' }; // More than 48h before
  };

  const urgencyColors = getUrgencyColor();

  return (
    <div className="bg-background/95 backdrop-blur-sm border-b px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={previousPeriod}
            disabled={currentPeriod === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={nextPeriod}
            disabled={currentPeriod === scenario.periodResults.length}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Period Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Period:</span>
          <span className="font-mono font-medium">
            {currentPeriod} / {scenario.periodResults.length}
          </span>
        </div>
      </div>

      {/* Timeline Info */}
      <div className="flex items-center gap-6 text-sm">
        <div>
          <span className="text-muted-foreground">Simulation Time:</span>
          <span className="ml-2 font-mono font-medium">
            {simulationDate.toLocaleString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${urgencyColors.dot}`} />
          <span className="text-muted-foreground">
            {hoursToLandfall >= 0 ? 'Time Since Landfall:' : 'Time to Landfall:'}
          </span>
          <span className={`font-mono font-medium ${urgencyColors.text}`}>
            {hoursToLandfall >= 0 ? `T+${hoursToLandfall}h` : `T${hoursToLandfall}h`}
          </span>
        </div>
      </div>
    </div>
  );
}
