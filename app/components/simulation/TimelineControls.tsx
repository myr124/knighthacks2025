'use client';

import { Play, Pause, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSimulationStore } from '@/lib/stores/simulationStore';
import { formatDistanceToNow } from 'date-fns';

export function TimelineControls() {
  const isPlaying = useSimulationStore((state) => state.isPlaying);
  const speed = useSimulationStore((state) => state.speed);
  const currentTime = useSimulationStore((state) => state.currentTime);
  const play = useSimulationStore((state) => state.play);
  const pause = useSimulationStore((state) => state.pause);
  const setSpeed = useSimulationStore((state) => state.setSpeed);
  const tick = useSimulationStore((state) => state.tick);

  const simulationDate = new Date(currentTime);
  const hoursToLandfall = Math.max(0, 18 - Math.floor((currentTime - Date.now()) / (1000 * 60 * 60)));

  return (
    <div className="bg-background/95 backdrop-blur-sm border-b px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Play/Pause Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isPlaying ? 'default' : 'outline'}
            onClick={isPlaying ? pause : play}
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Play
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={tick}
            disabled={isPlaying}
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Step
          </Button>
        </div>

        {/* Speed Control */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Speed:</span>
          <Select
            value={speed.toString()}
            onValueChange={(value) => setSpeed(Number(value) as 1 | 2 | 5 | 10)}
          >
            <SelectTrigger className="w-24 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1x</SelectItem>
              <SelectItem value="2">2x</SelectItem>
              <SelectItem value="5">5x</SelectItem>
              <SelectItem value="10">10x</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Timeline Info */}
      <div className="flex items-center gap-6 text-sm">
        <div>
          <span className="text-muted-foreground">Simulation Time:</span>
          <span className="ml-2 font-mono font-medium">
            {simulationDate.toLocaleString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            hoursToLandfall <= 6 ? 'bg-red-500' : hoursToLandfall <= 12 ? 'bg-orange-500' : 'bg-yellow-500'
          }`} />
          <span className="text-muted-foreground">Time to Landfall:</span>
          <span className={`font-mono font-medium ${
            hoursToLandfall <= 6 ? 'text-red-600' : hoursToLandfall <= 12 ? 'text-orange-600' : 'text-yellow-600'
          }`}>
            T-{hoursToLandfall}h
          </span>
        </div>
      </div>
    </div>
  );
}
