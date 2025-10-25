'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTTXStore } from '@/lib/stores/ttxStore';
import { AlertTriangle, Users, TrendingUp, AlertCircle, Navigation, Home, } from 'lucide-react';
import type { PersonaResponse } from '@/lib/types/ttx';

const SENTIMENT_COLORS: Record<PersonaResponse['sentiment'], string> = {
  calm: 'bg-green-500',
  concerned: 'bg-yellow-500',
  anxious: 'bg-orange-500',
  panicked: 'bg-red-500',
  skeptical: 'bg-purple-500',
  defiant: 'bg-pink-500'
};

const DECISION_ICONS: Record<PersonaResponse['decision'], any> = {
  stay_home: Home,
  evacuate: Navigation,
  shelter_in_place: Home,
  help_neighbors: Users,
  gather_info: AlertCircle,
  wait_and_see: AlertCircle
};

export function PeriodDetailView() {
  const scenario = useTTXStore((state) => state.scenario);
  const currentPeriod = useTTXStore((state) => state.currentPeriod);

  if (!scenario) return null;

  const result = scenario.periodResults[currentPeriod - 1];
  const { injects, eocActions, personaResponses, aggregates } = result;

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full flex gap-6 p-6">
        {/* Left Column - Injects & Actions */}
        <div className="w-96 space-y-4">
          {/* Injects */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Injects ({injects.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {injects.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No injects for this period</p>
                  ) : (
                    injects.map((inject) => (
                      <div key={inject.id} className="border-l-2 border-blue-500 pl-3 py-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs font-mono">
                            {inject.time}
                          </Badge>
                          <Badge
                            variant={inject.severity === 'critical' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {inject.severity}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-sm">{inject.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{inject.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* EOC Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                EOC Actions ({eocActions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {eocActions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No actions scheduled</p>
                  ) : (
                    eocActions.map((action) => (
                      <div key={action.id} className="border-l-2 border-green-500 pl-3 py-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs font-mono">
                            {action.time}
                          </Badge>
                          <Badge className="text-xs capitalize">
                            {action.actionType.replace('_', ' ')}
                          </Badge>
                          {action.urgency && (
                            <Badge variant={action.urgency === 'mandatory' ? 'destructive' : 'secondary'} className="text-xs">
                              {action.urgency}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{action.details}</p>
                        {action.zone && (
                          <p className="text-xs text-muted-foreground mt-1">Target: {action.zone}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Aggregates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Total Personas</div>
                <div className="text-2xl font-bold">{aggregates.totalPersonas}</div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-2">Decisions</div>
                <div className="space-y-1">
                  {Object.entries(aggregates.decisions).map(([decision, count]) => (
                    count > 0 && (
                      <div key={decision} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{decision.replace('_', ' ')}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {aggregates.criticalIssues.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Critical Issues</div>
                  {aggregates.criticalIssues.map((issue, i) => (
                    <div key={i} className="text-xs bg-destructive/10 text-destructive p-2 rounded mb-1">
                      {issue}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Persona Responses */}
        <div className="flex-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Persona Responses ({personaResponses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="grid grid-cols-2 gap-3">
                  {personaResponses.map((persona) => {
                    const DecisionIcon = DECISION_ICONS[persona.decision];
                    return (
                      <Card key={persona.personaId} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-sm">{persona.personaName}</h4>
                              <p className="text-xs text-muted-foreground">{persona.personaType}</p>
                            </div>
                            <DecisionIcon className="h-4 w-4 text-muted-foreground" />
                          </div>

                          <div className="flex flex-wrap gap-1 mb-2">
                            <Badge className={`${SENTIMENT_COLORS[persona.sentiment]} text-white text-xs`}>
                              {persona.sentiment}
                            </Badge>
                            <Badge variant="outline" className="text-xs capitalize">
                              {persona.decision.replace('_', ' ')}
                            </Badge>
                            {persona.needsAssistance && (
                              <Badge variant="destructive" className="text-xs">
                                Needs Help
                              </Badge>
                            )}
                          </div>

                          <p className="text-xs leading-relaxed mb-2 line-clamp-3">
                            {persona.reasoning}
                          </p>

                          {persona.concerns.length > 0 && (
                            <div className="mt-2 pt-2 border-t">
                              <div className="text-xs text-muted-foreground mb-1">Concerns:</div>
                              <div className="flex flex-wrap gap-1">
                                {persona.concerns.slice(0, 2).map((concern, i) => (
                                  <span key={i} className="text-xs bg-accent px-2 py-0.5 rounded">
                                    {concern}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
