'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScenarioConfigForm } from '@/app/components/configure/ScenarioConfigForm';
import { TTXScriptReviewPanel } from '@/app/components/configure/TTXScriptReviewPanel';
import { generateTTXScript, type ScenarioConfig } from '@/lib/utils/ttxGenerator';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ConfigurePage() {
  const router = useRouter();
  const [generatedScript, setGeneratedScript] = useState<ReturnType<typeof generateTTXScript> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGenerate = async (config: ScenarioConfig) => {
    setIsGenerating(true);

    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const script = generateTTXScript(config);
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
          scenarioType: generatedScript.scenarioType,
          location: generatedScript.location,
          startTime: generatedScript.periods[0].startTime,
          endTime: generatedScript.periods[generatedScript.periods.length - 1].endTime,
          totalOperationalPeriods: generatedScript.periods.length
        },
        periodResults: result.periodResults.map((periodResult: any) => {
          const period = generatedScript.periods.find(p => p.periodNumber === periodResult.periodNumber);
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
      useTTXStoreV2.getState().setScenario(scenarioResults);

      // Navigate to simulation view
      router.push('/simulation-v2');
    } catch (error) {
      console.error('Error submitting scenario:', error);
      alert('Failed to submit scenario. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          </div>

          {/* Right: Script Review */}
          {generatedScript && (
            <div>
              <TTXScriptReviewPanel
                script={generatedScript}
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
