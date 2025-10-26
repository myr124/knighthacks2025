'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScenarioConfigForm } from '@/app/components/ScenarioConfigForm';
import { TTXScriptReviewPanel } from '@/app/components/TTXScriptReviewPanel';
import { generateTTX, type ScenarioConfig, type OperationalPeriod } from '@/lib/utils/ttxGenerator';
// Removed mock plan loader; plans are now opened from the sidebar session tile
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/app/components/ThemeToggle';

export default function ConfigurePage() {
  const router = useRouter();
  const [generatedScript, setGeneratedScript] = useState<ReturnType<typeof generateTTX> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGenerate = async (config: ScenarioConfig) => {
    setIsGenerating(true);

    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 500));

  const script = generateTTX(config);
    setGeneratedScript(script);
    setIsGenerating(false);
  };

  const handleSubmit = async () => {
    if (!generatedScript) return;

    setIsSubmitting(true);

    try {
      // Prepare the request payload matching ADK spec
      const payload = {
        scenarioId: crypto.randomUUID(),
        scenarioType: generatedScript.scenarioType,
        location: generatedScript.location,
        totalOperationalPeriods: generatedScript.periods.length,
        actionPlan: {
          periods: generatedScript.periods
        }
      };

      // Submit to backend
      const response = await fetch('/api/ttx/generate-scenario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to submit scenario to backend');
      }

      const result = await response.json();

      // Transform the backend response to match ScenarioResults format
      const scenarioResults = {
        id: payload.scenarioId,
        ttxScript: {
          id: crypto.randomUUID(),
          name: `${generatedScript.scenarioType} - ${generatedScript.location}`,
          description: `${generatedScript.severity} ${generatedScript.scenarioType} scenario`,
          scenarioType: generatedScript.scenarioType as any,
          location: generatedScript.location,
          startTime: '',
          endTime: '',
          totalOperationalPeriods: generatedScript.periods.length
        },
        periodResults: result.periodResults.map((periodResult: any) => {
          const period = generatedScript.periods.find((p: OperationalPeriod) => p.periodNumber === periodResult.periodNumber);
          return {
            periodNumber: periodResult.periodNumber,
            operationalPeriod: period,
            injects: period?.injects || [],
            eocActions: period?.eocActions || [],
            personaResponses: periodResult.personaResponses,
            aggregates: calculateAggregates(periodResult.personaResponses)
          };
        }),
        createdAt: new Date(),
        status: result.status,
        generationTime: result.generationTime
      };

      // Store the result in Zustand
      const { useTTXStoreV2 } = await import('@/lib/stores/ttxStoreV2');
  useTTXStoreV2.getState().setScenario(scenarioResults as any);

      // Navigate to simulation view
      router.push('/simulation-v2');
    } catch (error) {
      console.error('Error submitting scenario:', error);
      alert('Failed to submit scenario. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mock plan loader removed; use the Hurricane Melissa card in the sidebar to open session-stored plans

  // Helper to calculate aggregates
  function calculateAggregates(responses: any[]) {
    const decisions: Record<string, number> = {
      stay_home: 0, evacuate: 0, shelter_in_place: 0,
      help_neighbors: 0, gather_info: 0, wait_and_see: 0
    };

    const sentiments: Record<string, number> = {
      calm: 0, concerned: 0, anxious: 0, panicked: 0, skeptical: 0, defiant: 0
    };

    const locations: Record<string, number> = {
      home: 0, evacuating: 0, shelter: 0, with_family: 0, helping_others: 0
    };

    let needingAssistance = 0;

    responses.forEach((r: any) => {
      decisions[r.decision] = (decisions[r.decision] || 0) + 1;
      sentiments[r.sentiment] = (sentiments[r.sentiment] || 0) + 1;
      locations[r.location] = (locations[r.location] || 0) + 1;
      if (r.needsAssistance) needingAssistance++;
    });

    const criticalIssues: string[] = [];
    if (needingAssistance > 10) criticalIssues.push(`${needingAssistance} personas need assistance`);
    if (decisions.stay_home > 25) {
      criticalIssues.push('High number of residents refusing to evacuate');
    }

    return {
      totalPersonas: responses.length,
      decisions: decisions as any,
      sentiments: sentiments as any,
      locations: locations as any,
      needingAssistance,
      criticalIssues
    };
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Configure Scenario</h1>
                <p className="text-sm text-muted-foreground">
                  Set up a new disaster scenario for simulation
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Configuration Form */}
          <div className={generatedScript ? 'lg:sticky lg:top-8 lg:self-start' : ''}>
            <ScenarioConfigForm
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />
            {/* Mock plan button removed; open from sidebar session tile instead */}
          </div>

          {/* Right: Script Review */}
          {generatedScript && (
            <div>
              <TTXScriptReviewPanel
                script={generatedScript as any}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            </div>
          )}

          {/* Placeholder when no script */}
          {!generatedScript && (
            <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-12">
              <div className="text-center text-muted-foreground">
                <p className="text-lg font-medium mb-2">No TTX Script Generated</p>
                <p className="text-sm">
                  Fill out the configuration form and click &quot;Generate TTX Script&quot; to preview the scenario.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
