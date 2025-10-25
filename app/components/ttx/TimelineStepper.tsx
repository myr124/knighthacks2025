'use client';

import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTTXStore } from '@/lib/stores/ttxStore';

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

export function TimelineStepper() {
  const scenario = useTTXStore((state) => state.scenario);
  const currentPeriod = useTTXStore((state) => state.currentPeriod);
  const nextPeriod = useTTXStore((state) => state.nextPeriod);
  const previousPeriod = useTTXStore((state) => state.previousPeriod);
  const setCurrentPeriod = useTTXStore((state) => state.setCurrentPeriod);

  if (!scenario) return null;

  const currentResult = scenario.periodResults[currentPeriod - 1];
  const op = currentResult.operationalPeriod;

  return (
    <div className="border-b bg-background">
      {/* Top Bar - Current Period Info */}
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-lg">{op.label}</h2>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="outline" className="font-mono text-xs">
                {op.startTime} to {op.endTime}
              </Badge>
              <Badge className={PHASE_COLORS[op.phase]}>
                {PHASE_LABELS[op.phase]}
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
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

          <div className="px-3 py-1 bg-accent rounded text-sm font-medium">
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
      <div className="px-6 pb-4">
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
                    ? `${PHASE_COLORS[phase]} ring-2 ring-offset-2 ring-${phase === 'planning' ? 'blue' : phase === 'preparation' ? 'yellow' : phase === 'response' ? 'red' : 'green'}-500`
                    : isPast
                    ? PHASE_COLORS[phase]
                    : 'bg-accent'
                } hover:opacity-80`}
                title={result.operationalPeriod.label}
              />
            );
          })}
        </div>

        {/* Period Labels (every 2 periods) */}
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          {scenario.periodResults
            .filter((_, i) => i % 2 === 0)
            .map((result) => (
              <div key={result.periodNumber} className="text-center">
                {result.operationalPeriod.startTime}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
