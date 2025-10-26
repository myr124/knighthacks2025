'use client';

import { X, User, MapPin, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSimulationStore } from '@/lib/stores/simulationStore';

const STATUS_CONFIG = {
  at_home: { label: 'At Home', color: 'bg-gray-500' },
  evacuating: { label: 'Evacuating', color: 'bg-orange-500' },
  sheltered: { label: 'Sheltered', color: 'bg-green-500' },
  stranded: { label: 'Stranded', color: 'bg-red-500' },
};

export function AgentInspectionPanel() {
  const selectedAgentId = useSimulationStore((state) => state.selectedAgentId);
  const agents = useSimulationStore((state) => state.agents);
  const selectAgent = useSimulationStore((state) => state.selectAgent);

  const agent = agents.find((a) => a.id === selectedAgentId);

  if (!agent) return null;

  const statusConfig = STATUS_CONFIG[agent.status];

  return (
    <div className="absolute top-0 right-0 w-96 h-full bg-background border-l shadow-xl z-20 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{agent.name}</h3>
            <Badge variant="secondary" className="mt-1">
              <div className={`w-2 h-2 rounded-full ${statusConfig.color} mr-1.5`} />
              {statusConfig.label}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => selectAgent(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Location Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Current Location
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Latitude:</span>
              <span className="font-mono">{agent.position[0].toFixed(4)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Longitude:</span>
              <span className="font-mono">{agent.position[1].toFixed(4)}°</span>
            </div>
          </CardContent>
        </Card>

        {/* Destination */}
        {agent.destination && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Destination
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Latitude:</span>
                <span className="font-mono">{agent.destination[0].toFixed(4)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Longitude:</span>
                <span className="font-mono">{agent.destination[1].toFixed(4)}°</span>
              </div>
              <div className="pt-2 mt-2 border-t">
                <span className="text-muted-foreground">Distance:</span>
                <span className="ml-2 font-medium">
                  {calculateDistance(agent.position, agent.destination).toFixed(1)} km
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Current Activity</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="text-muted-foreground">
              {getActivityDescription(agent.status)}
            </p>
          </CardContent>
        </Card>

        {/* Mock Demographics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Demographics</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Age:</span>
              <span>{getMockAge(agent.id)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Family Size:</span>
              <span>{getMockFamilySize(agent.id)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vehicle:</span>
              <span>{getMockVehicle(agent.id) ? 'Yes' : 'No'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {getRecentActivity(agent).map((activity, i) => (
                <div key={i} className="flex gap-2 pb-2 border-b last:border-0 last:pb-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                    <p>{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper functions
function calculateDistance(pos1: [number, number], pos2: [number, number]): number {
  const R = 6371; // Earth's radius in km
  const dLat = (pos2[0] - pos1[0]) * Math.PI / 180;
  const dLon = (pos2[1] - pos1[1]) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(pos1[0] * Math.PI / 180) * Math.cos(pos2[0] * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getActivityDescription(status: string): string {
  switch (status) {
    case 'at_home':
      return 'Currently at home, monitoring situation and preparing for potential evacuation.';
    case 'evacuating':
      return 'Actively evacuating to designated shelter location. In transit on evacuation route.';
    case 'sheltered':
      return 'Successfully arrived at emergency shelter. Safe and accounted for.';
    case 'stranded':
      return 'Unable to continue evacuation. Requires emergency assistance.';
    default:
      return 'Status unknown.';
  }
}

function getMockAge(id: string): number {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 18 + (hash % 65);
}

function getMockFamilySize(id: string): number {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 1 + (hash % 5);
}

function getMockVehicle(id: string): boolean {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return hash % 3 !== 0;
}

function getRecentActivity(agent: any) {
  return [
    {
      time: '5 minutes ago',
      description: agent.status === 'evacuating'
        ? 'Started evacuation journey'
        : 'Received evacuation advisory alert'
    },
    {
      time: '15 minutes ago',
      description: 'Checked weather forecast and news updates'
    },
    {
      time: '1 hour ago',
      description: 'Received mandatory evacuation order for zone'
    }
  ];
}
