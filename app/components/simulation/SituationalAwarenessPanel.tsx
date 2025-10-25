'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useSimulationStore } from '@/lib/stores/simulationStore';
import { Users, Home, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function SituationalAwarenessPanel() {
  const metrics = useSimulationStore((state) => state.metrics);
  const agents = useSimulationStore((state) => state.agents);

  const totalAgents = agents.length;

  return (
    <div className="w-80 bg-background border-l overflow-y-auto">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Situational Awareness</h2>
        <p className="text-sm text-muted-foreground">Real-time Metrics</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Evacuation Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Evacuation Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold">{metrics.evacuationProgress}%</span>
                <span className="text-sm text-muted-foreground">
                  {metrics.totalEvacuated + metrics.inTransit}/{totalAgents}
                </span>
              </div>
              <Progress value={metrics.evacuationProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.totalEvacuated} sheltered, {metrics.inTransit} in transit
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Agent Status Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Population Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-gray-500" />
                <span className="text-sm">At Home</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold">{metrics.atHome}</span>
                <div className="w-16 bg-secondary rounded-full h-1.5">
                  <div
                    className="bg-gray-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${(metrics.atHome / totalAgents) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Evacuating</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold">{metrics.inTransit}</span>
                <div className="w-16 bg-secondary rounded-full h-1.5">
                  <div
                    className="bg-orange-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${(metrics.inTransit / totalAgents) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">Sheltered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold">{metrics.sheltered}</span>
                <div className="w-16 bg-secondary rounded-full h-1.5">
                  <div
                    className="bg-green-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${(metrics.sheltered / totalAgents) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-center">
                <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-2xl font-bold">{totalAgents}</div>
                <div className="text-xs text-muted-foreground">Total Population</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-center">
                <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-500" />
                <div className="text-2xl font-bold">{metrics.sheltered}</div>
                <div className="text-xs text-muted-foreground">Safe in Shelters</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estimated Time to Complete */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Estimated Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {Math.max(0, Math.round((100 - metrics.evacuationProgress) * 0.15))}
              </span>
              <span className="text-sm text-muted-foreground">hours remaining</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on current evacuation rate
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
