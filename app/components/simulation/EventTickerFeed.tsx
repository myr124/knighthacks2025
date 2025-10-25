'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSimulationStore } from '@/lib/stores/simulationStore';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';

const SEVERITY_CONFIG = {
  info: { icon: Info, color: 'bg-blue-500', variant: 'default' as const },
  warning: { icon: AlertTriangle, color: 'bg-orange-500', variant: 'secondary' as const },
  critical: { icon: AlertCircle, color: 'bg-red-500', variant: 'destructive' as const },
};

export function EventTickerFeed() {
  const events = useSimulationStore((state) => state.events);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Event Feed</span>
          <Badge variant="outline" className="font-normal">
            {events.length} events
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto px-6 pb-4 space-y-2"
        >
          {events.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              No events yet. Start simulation to see activity.
            </div>
          ) : (
            events.map((event) => {
              const config = SEVERITY_CONFIG[event.severity];
              const Icon = config.icon;
              const eventTime = new Date(event.timestamp);

              return (
                <div
                  key={event.id}
                  className="flex gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className={`w-1 rounded-full ${config.color} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${
                        event.severity === 'critical' ? 'text-red-500' :
                        event.severity === 'warning' ? 'text-orange-500' :
                        'text-blue-500'
                      }`} />
                      <span className="text-xs text-muted-foreground font-mono">
                        {eventTime.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <Badge variant={config.variant} className="text-xs px-1.5 py-0">
                        {event.type.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm leading-tight">{event.message}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
