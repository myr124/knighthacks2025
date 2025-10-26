'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTTXStoreV2 } from '@/lib/stores/ttxStoreV2';

const PHASE_COLORS = {
  planning: 'bg-blue-500',
  preparation: 'bg-yellow-500',
  response: 'bg-red-500',
  recovery: 'bg-green-500'
};

const PHASE_LABELS = {
  planning: 'Planning',
  preparation: 'Preparation',
  response: 'Response',
  recovery: 'Recovery'
};

export function PeriodTimelineControls() {
  const scenario = useTTXStoreV2((state) => state.scenario);
  const currentPeriod = useTTXStoreV2((state) => state.currentPeriod);
  const nextPeriod = useTTXStoreV2((state) => state.nextPeriod);
  const previousPeriod = useTTXStoreV2((state) => state.previousPeriod);
  const setCurrentPeriod = useTTXStoreV2((state) => state.setCurrentPeriod);

  if (!scenario) return null;

  const currentResult = scenario.periodResults[currentPeriod - 1];

  // Safety check for undefined currentResult
  if (!currentResult || !currentResult.operationalPeriod) return null;

  const op = currentResult.operationalPeriod;

  return (
    <div className="border-b bg-background/95 backdrop-blur-sm">
      {/* Main Control Bar */}
      <div className="px-6 py-3 flex items-center justify-between">
        {/* Left: Period Info */}
        <div className="flex items-center gap-4">
          <div>
            <h2 className="font-semibold text-lg">{op.label}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="font-mono text-xs">
                {op.startTime} to {op.endTime}
              </Badge>
              <Badge className={PHASE_COLORS[op.phase]}>
                {PHASE_LABELS[op.phase]}
              </Badge>
            </div>
          </div>
        </div>

        {/* Right: Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={previousPeriod}
            disabled={currentPeriod === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="px-4 py-2 bg-accent rounded font-medium text-sm">
            Period {currentPeriod} of {scenario.periodResults.length}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={nextPeriod}
            disabled={currentPeriod === scenario.periodResults.length}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Timeline Progress Bar */}
      <div className="px-6 pb-3">
        <div className="flex gap-1">
          {scenario.periodResults.map((result, index) => {
            const periodNum = index + 1;
            const isActive = periodNum === currentPeriod;
            const isPast = periodNum < currentPeriod;
            const phase = result.operationalPeriod.phase;

            return (
              <button
                key={periodNum}
                onClick={() => setCurrentPeriod(periodNum)}
                className={`flex-1 h-2 rounded-full transition-all ${
                  isActive
                    ? `${PHASE_COLORS[phase]} ring-2 ring-offset-1 ring-primary`
                    : isPast
                    ? PHASE_COLORS[phase]
                    : 'bg-accent'
                } hover:opacity-80 cursor-pointer`}
                title={result.operationalPeriod.label}
              />
            );
          })}
        </div>

        {/* Phase Labels */}
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>T-120h</span>
          <span>T-72h</span>
          <span>T-24h</span>
          <span>Landfall</span>
          <span>T+24h</span>
        </div>
      </div>
    </div>
  );
}
