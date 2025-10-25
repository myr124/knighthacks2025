import { create } from 'zustand';
import type { Agent, SimulationState, SimulationEvent, SituationMetrics } from '@/lib/types/simulation';

interface SimulationStore extends SimulationState {
  selectedAgentId: string | null;
  metrics: SituationMetrics;

  // Actions
  play: () => void;
  pause: () => void;
  setSpeed: (speed: 1 | 2 | 5 | 10) => void;
  updateAgents: (agents: Agent[]) => void;
  addEvent: (event: SimulationEvent) => void;
  selectAgent: (id: string | null) => void;
  tick: () => void;
}

// Mock data generator
function generateMockAgents(count: number): Agent[] {
  const statuses: Agent['status'][] = ['at_home', 'evacuating', 'sheltered', 'stranded'];

  // Miami-Dade area coordinates
  const centerLat = 25.7617;
  const centerLng = -80.1918;

  return Array.from({ length: count }, (_, i) => ({
    id: `agent-${i}`,
    name: `Agent ${i + 1}`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    position: [
      centerLat + (Math.random() - 0.5) * 0.3,
      centerLng + (Math.random() - 0.5) * 0.3
    ] as [number, number],
    destination: Math.random() > 0.5 ? [
      centerLat + (Math.random() - 0.5) * 0.5,
      centerLng + (Math.random() - 0.5) * 0.5
    ] as [number, number] : undefined
  }));
}

function calculateMetrics(agents: Agent[]): SituationMetrics {
  const total = agents.length;
  const evacuating = agents.filter(a => a.status === 'evacuating').length;
  const sheltered = agents.filter(a => a.status === 'sheltered').length;
  const atHome = agents.filter(a => a.status === 'at_home').length;
  const inTransit = evacuating;

  return {
    evacuationProgress: Math.round(((evacuating + sheltered) / total) * 100),
    totalEvacuated: sheltered,
    atHome,
    sheltered,
    inTransit
  };
}

// Generate initial events for demo
function generateInitialEvents(): SimulationEvent[] {
  const now = Date.now();
  return [
    {
      id: 'event-1',
      timestamp: now - 300000,
      type: 'evacuation',
      severity: 'critical',
      message: 'MANDATORY evacuation order issued for Zones A and B - Category 4 hurricane approaching'
    },
    {
      id: 'event-2',
      timestamp: now - 240000,
      type: 'shelter',
      severity: 'info',
      message: 'Emergency shelter opened at Miami-Dade Community Center (capacity: 500)'
    },
    {
      id: 'event-3',
      timestamp: now - 180000,
      type: 'traffic',
      severity: 'warning',
      message: 'Heavy traffic reported on I-95 Northbound near Exit 12 - delays of 45 minutes'
    },
    {
      id: 'event-4',
      timestamp: now - 120000,
      type: 'evacuation',
      severity: 'info',
      message: '8 agents have successfully reached shelter locations'
    },
    {
      id: 'event-5',
      timestamp: now - 60000,
      type: 'hazard',
      severity: 'warning',
      message: 'Tropical storm force winds (45 mph) now affecting coastal areas'
    }
  ];
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  isPlaying: false,
  currentTime: Date.now(),
  speed: 1,
  agents: generateMockAgents(25),
  events: generateInitialEvents(),
  selectedAgentId: null,
  metrics: { evacuationProgress: 0, totalEvacuated: 0, atHome: 0, sheltered: 0, inTransit: 0 },

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  setSpeed: (speed) => set({ speed }),

  updateAgents: (agents) => set({
    agents,
    metrics: calculateMetrics(agents)
  }),

  addEvent: (event) => set((state) => ({
    events: [event, ...state.events].slice(0, 50) // Keep last 50 events
  })),

  selectAgent: (id) => set({ selectedAgentId: id }),

  tick: () => {
    const state = get();
    if (!state.isPlaying) return;

    // Move agents toward destination
    const updatedAgents = state.agents.map(agent => {
      if (agent.status === 'evacuating' && agent.destination) {
        const [lat, lng] = agent.position;
        const [destLat, destLng] = agent.destination;

        const speed = 0.001; // degrees per tick
        const dx = destLat - lat;
        const dy = destLng - lng;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < speed) {
          // Reached destination
          return { ...agent, status: 'sheltered' as const, position: agent.destination };
        }

        return {
          ...agent,
          position: [
            lat + (dx / dist) * speed,
            lng + (dy / dist) * speed
          ] as [number, number]
        };
      }

      // Random chance to start evacuating
      if (agent.status === 'at_home' && Math.random() < 0.01) {
        const centerLat = 25.7617;
        const centerLng = -80.1918;
        return {
          ...agent,
          status: 'evacuating' as const,
          destination: [
            centerLat + (Math.random() - 0.5) * 0.5,
            centerLng + (Math.random() - 0.5) * 0.5
          ] as [number, number]
        };
      }

      return agent;
    });

    set({
      agents: updatedAgents,
      currentTime: state.currentTime + (1000 * 60 * state.speed), // Advance time
      metrics: calculateMetrics(updatedAgents)
    });
  }
}));

// Initialize metrics
useSimulationStore.setState(state => ({
  metrics: calculateMetrics(state.agents)
}));
