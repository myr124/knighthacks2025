
'use client';

import { motion } from 'framer-motion';
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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="space-y-1"
          >
            <h4 className="text-sm font-semibold">Time</h4>
            <p className="text-sm text-muted-foreground font-mono">{selectedEvent.time}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="space-y-1"
          >
            <h4 className="text-sm font-semibold">{isInject ? 'Title' : 'Details'}</h4>
            <p className="text-sm text-muted-foreground">
              {isInject ? selectedEvent.title : selectedEvent.details}
            </p>
          </motion.div>
          {isInject && selectedEvent.description && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="space-y-1"
            >
              <h4 className="text-sm font-semibold">Description</h4>
              <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
            </motion.div>
          )}
          {isInject && selectedEvent.severity && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="space-y-1"
            >
              <h4 className="text-sm font-semibold">Severity</h4>
              <Badge variant={selectedEvent.severity === 'critical' ? 'destructive' : 'secondary'}>
                {selectedEvent.severity}
              </Badge>
            </motion.div>
          )}
          {!isInject && selectedEvent.urgency && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="space-y-1"
            >
              <h4 className="text-sm font-semibold">Urgency</h4>
              <Badge variant={selectedEvent.urgency === 'mandatory' ? 'destructive' : 'secondary'}>
                {selectedEvent.urgency}
              </Badge>
            </motion.div>
          )}
          {!isInject && selectedEvent.targetPopulation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="space-y-1"
            >
              <h4 className="text-sm font-semibold">Target Population</h4>
              <p className="text-sm text-muted-foreground">{selectedEvent.targetPopulation}</p>
            </motion.div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => setSelectedEvent(null)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
