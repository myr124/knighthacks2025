'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTTXStoreV2 } from '@/lib/stores/ttxStoreV2';
import { Clock, AlertTriangle, Navigation, SkipForward } from 'lucide-react';

export function PeriodNavigator() {
  const scenario = useTTXStoreV2((state) => state.scenario);
  const currentPeriod = useTTXStoreV2((state) => state.currentPeriod);
  const setCurrentPeriod = useTTXStoreV2((state) => state.setCurrentPeriod);

  if (!scenario) return null;

  const currentResult = scenario.periodResults[currentPeriod - 1];

  // Safety check for undefined currentResult
  if (!currentResult || !currentResult.operationalPeriod) return null;

  const op = currentResult.operationalPeriod;

  // Find key periods
  const planningEnd = scenario.periodResults.findIndex(r => r.operationalPeriod.phase !== 'planning');
  const prepEnd = scenario.periodResults.findIndex(r => r.operationalPeriod.phase === 'response');
  const responseEnd = scenario.periodResults.findIndex(r => r.operationalPeriod.phase === 'recovery');

  return (
    <div className="w-80 bg-background border-r overflow-y-auto">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Period Navigator</h2>
        <p className="text-sm text-muted-foreground">Jump to key moments</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Current Period Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Current Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Number:</span>
                <span className="font-semibold">Period {currentPeriod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phase:</span>
                <Badge>{op.phase}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time:</span>
                <span className="font-mono text-xs">{op.startTime} to {op.endTime}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Jump */}
        <div>
          <h3 className="text-sm font-medium mb-3">Quick Jump to Phase</h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => setCurrentPeriod(1)}
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Jump to Start (T-120h)
            </Button>

            {planningEnd > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setCurrentPeriod(planningEnd + 1)}
              >
                <SkipForward className="h-4 w-4 mr-2" />
                Jump to Preparation
              </Button>
            )}

            {prepEnd > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setCurrentPeriod(prepEnd + 1)}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Jump to Response
              </Button>
            )}

            {responseEnd > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setCurrentPeriod(responseEnd + 1)}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Jump to Recovery
              </Button>
            )}
          </div>
        </div>

        {/* Period Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Period Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Injects</span>
                <Badge variant="outline">{currentResult.injects.length}</Badge>
              </div>
              {currentResult.injects.slice(0, 2).map(inject => (
                <div key={inject.id} className="text-xs bg-accent/50 p-2 rounded mb-1">
                  {inject.title}
                </div>
              ))}
              {currentResult.injects.length > 2 && (
                <div className="text-xs text-muted-foreground">
                  +{currentResult.injects.length - 2} more
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">EOC Actions</span>
                <Badge variant="outline">{currentResult.eocActions.length}</Badge>
              </div>
              {currentResult.eocActions.slice(0, 2).map(action => (
                <div key={action.id} className="text-xs bg-accent/50 p-2 rounded mb-1">
                  {action.details.substring(0, 40)}...
                </div>
              ))}
              {currentResult.eocActions.length > 2 && (
                <div className="text-xs text-muted-foreground">
                  +{currentResult.eocActions.length - 2} more
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Critical Issues */}
        {currentResult.aggregates.criticalIssues.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Critical Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentResult.aggregates.criticalIssues.map((issue, i) => (
                <div key={i} className="text-xs bg-destructive/10 text-destructive p-2 rounded mb-2">
                  {issue}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
