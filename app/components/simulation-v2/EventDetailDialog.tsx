
'use client';

import { useTTXStoreV2 } from '@/lib/stores/ttxStoreV2';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function EventDetailDialog() {
  const selectedEvent = useTTXStoreV2((state) => state.selectedEvent);
  const setSelectedEvent = useTTXStoreV2((state) => state.setSelectedEvent);

  const isOpen = !!selectedEvent;

  if (!selectedEvent) return null;

  const isInject = selectedEvent.eventType === 'inject';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && setSelectedEvent(null)}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {isInject ? 'Inject Detail' : 'EOC Action Detail'}
            <Badge variant={isInject ? 'default' : 'secondary'}>
              {isInject ? 'INJECT' : 'EOC ACTION'}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Time</h4>
            <p className="text-sm text-muted-foreground font-mono">{selectedEvent.time}</p>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{isInject ? 'Title' : 'Details'}</h4>
            <p className="text-sm text-muted-foreground">
              {isInject ? selectedEvent.title : selectedEvent.details}
            </p>
          </div>
          {isInject && selectedEvent.description && (
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">Description</h4>
              <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
            </div>
          )}
          {isInject && selectedEvent.severity && (
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">Severity</h4>
              <Badge variant={selectedEvent.severity === 'critical' ? 'destructive' : 'secondary'}>
                {selectedEvent.severity}
              </Badge>
            </div>
          )}
          {!isInject && selectedEvent.urgency && (
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">Urgency</h4>
              <Badge variant={selectedEvent.urgency === 'mandatory' ? 'destructive' : 'secondary'}>
                {selectedEvent.urgency}
              </Badge>
            </div>
          )}
          {!isInject && selectedEvent.targetPopulation && (
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">Target Population</h4>
              <p className="text-sm text-muted-foreground">{selectedEvent.targetPopulation}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => setSelectedEvent(null)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
