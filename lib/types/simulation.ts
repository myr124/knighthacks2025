export type AgentStatus = 'at_home' | 'evacuating' | 'sheltered' | 'stranded';

export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  position: [number, number]; // [lat, lng]
  destination?: [number, number];
}

export interface SimulationState {
  isPlaying: boolean;
  currentTime: number; // timestamp
  speed: 1 | 2 | 5 | 10;
  agents: Agent[];
  events: SimulationEvent[];
}

export interface SimulationEvent {
  id: string;
  timestamp: number;
  type: 'evacuation' | 'traffic' | 'shelter' | 'hazard';
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

export interface SituationMetrics {
  evacuationProgress: number; // 0-100
  totalEvacuated: number;
  atHome: number;
  sheltered: number;
  inTransit: number;
}
