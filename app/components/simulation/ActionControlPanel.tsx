'use client';

import { useState } from 'react';
import { AlertTriangle, Home, Navigation, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSimulationStore } from '@/lib/stores/simulationStore';
import { Badge } from '@/components/ui/badge';

interface Action {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}

const ACTIONS: Action[] = [
  {
    id: 'evacuation_order',
    label: 'Issue Evacuation Order',
    icon: AlertTriangle,
    description: 'Issue mandatory or voluntary evacuation for zones',
    color: 'text-orange-500'
  },
  {
    id: 'open_shelter',
    label: 'Open Emergency Shelter',
    icon: Home,
    description: 'Activate emergency shelter location',
    color: 'text-green-500'
  },
  {
    id: 'contraflow',
    label: 'Activate Contraflow',
    icon: Navigation,
    description: 'Reverse lanes on major highways',
    color: 'text-blue-500'
  },
  {
    id: 'inject_hazard',
    label: 'Inject Hazard Event',
    icon: Zap,
    description: 'Simulate power outage or road closure',
    color: 'text-red-500'
  }
];

export function ActionControlPanel() {
  const [selectedZone, setSelectedZone] = useState('A');
  const [selectedUrgency, setSelectedUrgency] = useState('mandatory');
  const addEvent = useSimulationStore((state) => state.addEvent);

  const handleAction = (actionId: string) => {
    let message = '';
    let severity: 'info' | 'warning' | 'critical' = 'info';

    switch (actionId) {
      case 'evacuation_order':
        message = `${selectedUrgency.toUpperCase()} evacuation order issued for Zone ${selectedZone}`;
        severity = selectedUrgency === 'mandatory' ? 'critical' : 'warning';
        break;
      case 'open_shelter':
        message = `Emergency shelter activated at Miami-Dade Community Center`;
        severity = 'info';
        break;
      case 'contraflow':
        message = `Contraflow activated on I-95 Northbound - All lanes now outbound`;
        severity = 'warning';
        break;
      case 'inject_hazard':
        message = `ALERT: Power outage reported in Zone C affecting 2,400 residents`;
        severity = 'critical';
        break;
    }

    addEvent({
      id: `event-${Date.now()}`,
      timestamp: Date.now(),
      type: 'evacuation',
      severity,
      message
    });
  };

  return (
    <div className="w-80 bg-background border-r overflow-y-auto">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Command & Control</h2>
        <p className="text-sm text-muted-foreground">Emergency Manager Actions</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick Parameters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Quick Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Target Zone
              </label>
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Zone A (Coastal)</SelectItem>
                  <SelectItem value="B">Zone B (Low-lying)</SelectItem>
                  <SelectItem value="C">Zone C (Inland)</SelectItem>
                  <SelectItem value="D">Zone D (All Areas)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Urgency Level
              </label>
              <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mandatory">Mandatory</SelectItem>
                  <SelectItem value="voluntary">Voluntary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium mb-3">Available Actions</h3>
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.id}
                className="hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => handleAction(action.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors`}>
                      <Icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm mb-0.5">{action.label}</h4>
                      <p className="text-xs text-muted-foreground leading-tight">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Active Orders */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2 bg-accent/50 rounded">
                <span>Zone A Evacuation</span>
                <Badge variant="destructive" className="text-xs">MANDATORY</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-accent/50 rounded">
                <span>Zone B Evacuation</span>
                <Badge variant="secondary" className="text-xs">VOLUNTARY</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                2 active orders affecting 15,000 residents
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
