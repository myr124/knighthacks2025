'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ConsolidatedHeader } from '@/app/components/simulation-v2/ConsolidatedHeader';
import { TabbedSidePanel } from '@/app/components/simulation-v2/TabbedSidePanel';
import { PersonaDetailDialog } from '@/app/components/simulation-v2/PersonaDetailDialog';
import { useTTXStoreV2 } from '@/lib/stores/ttxStoreV2';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle } from 'lucide-react';

// Dynamically import the map to avoid SSR issues
const PeriodMapView = dynamic(
  () => import('@/app/components/simulation-v2/PeriodMapView').then(mod => ({ default: mod.PeriodMapView })),
  { ssr: false, loading: () => <div className="w-full h-full bg-accent animate-pulse" /> }
);

export default function SimulationV2Page() {
  const scenario = useTTXStoreV2((state) => state.scenario);
  const currentPeriod = useTTXStoreV2((state) => state.currentPeriod);

  if (!scenario) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Scenario...</h1>
        </div>
      </div>
    );
  }

  const currentResult = scenario.periodResults[currentPeriod - 1];

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Consolidated Header */}
      <ConsolidatedHeader />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Center: Map + Event Feed */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Map */}
          <div className="flex-1 relative">
            <PeriodMapView />
          </div>

          {/* Bottom: Injects & Actions Feed */}
          <div className="h-40 border-t bg-background px-4 py-3 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4 h-full">
              {/* Injects */}
              <div className="overflow-y-auto">
                <h3 className="text-xs font-semibold mb-2 flex items-center gap-2 sticky top-0 bg-background pb-1">
                  <AlertTriangle className="h-3 w-3" />
                  Injects ({currentResult.injects.length})
                </h3>
                <div className="space-y-1.5">
                  {currentResult.injects.map((inject) => (
                    <div key={inject.id} className="border-l-2 border-blue-500 pl-2 py-0.5">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Badge variant="outline" className="text-[10px] font-mono py-0 h-4">
                          {inject.time}
                        </Badge>
                        <Badge
                          variant={inject.severity === 'critical' ? 'destructive' : 'secondary'}
                          className="text-[10px] py-0 h-4"
                        >
                          {inject.severity}
                        </Badge>
                      </div>
                      <p className="text-xs font-medium leading-tight">{inject.title}</p>
                    </div>
                  ))}
                  {currentResult.injects.length === 0 && (
                    <p className="text-xs text-muted-foreground">No injects this period</p>
                  )}
                </div>
              </div>

              {/* EOC Actions */}
              <div className="overflow-y-auto">
                <h3 className="text-xs font-semibold mb-2 flex items-center gap-2 sticky top-0 bg-background pb-1">
                  <CheckCircle className="h-3 w-3" />
                  EOC Actions ({currentResult.eocActions.length})
                </h3>
                <div className="space-y-1.5">
                  {currentResult.eocActions.map((action) => (
                    <div key={action.id} className="border-l-2 border-green-500 pl-2 py-0.5">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Badge variant="outline" className="text-[10px] font-mono py-0 h-4">
                          {action.time}
                        </Badge>
                        {action.urgency && (
                          <Badge variant={action.urgency === 'mandatory' ? 'destructive' : 'secondary'} className="text-[10px] py-0 h-4">
                            {action.urgency}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs leading-tight">{action.details}</p>
                    </div>
                  ))}
                  {currentResult.eocActions.length === 0 && (
                    <p className="text-xs text-muted-foreground">No actions scheduled</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Tabbed Side Panel */}
        <TabbedSidePanel />
      </div>

      {/* Persona Detail Dialog */}
      <PersonaDetailDialog />
    </div>
  );
}
