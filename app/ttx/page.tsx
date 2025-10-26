'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { TimelineStepper } from '@/app/components/ttx/TimelineStepper';
import { PeriodDetailView } from '@/app/components/ttx/PeriodDetailView';
import { useTTXStore } from '@/lib/stores/ttxStore';
import { Play, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/app/components/ThemeToggle';

export default function TTXPage() {
  const scenario = useTTXStore((state) => state.scenario);
  const isGenerating = useTTXStore((state) => state.isGenerating);
  const generateScenario = useTTXStore((state) => state.generateScenario);

  const handleRerun = async () => {
    await generateScenario({});
  };

  if (!scenario) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Scenario Loaded</h1>
          <Button onClick={handleRerun}>
            <Play className="h-4 w-4 mr-2" />
            Generate Scenario
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="border-b px-6 py-3 flex items-center justify-between bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold text-lg">{scenario.ttxScript.name}</h1>
            <p className="text-sm text-muted-foreground">{scenario.ttxScript.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {scenario.generationTime && (
            <div className="text-sm text-muted-foreground">
              Generated in {scenario.generationTime}s
            </div>
          )}
          <Button
            variant="outline"
            onClick={handleRerun}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-run Scenario
              </>
            )}
          </Button>
          <ThemeToggle />
        </div>
      </div>

      {/* Timeline Stepper */}
      <TimelineStepper />

      {/* Main Content */}
      <PeriodDetailView />
    </div>
  );
}
