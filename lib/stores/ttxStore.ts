import { create } from 'zustand';
import type { ScenarioResults, PeriodResult, OperationalPeriod, Inject, EOCAction, PersonaResponse } from '@/lib/types/ttx';

interface TTXStore {
  scenario: ScenarioResults | null;
  currentPeriod: number;
  isGenerating: boolean;

  // Actions
  setScenario: (scenario: ScenarioResults) => void;
  setCurrentPeriod: (period: number) => void;
  generateScenario: (actionPlan: any) => Promise<void>;
  nextPeriod: () => void;
  previousPeriod: () => void;
}

// Generate mock operational periods
function generateOperationalPeriods(): OperationalPeriod[] {
  const periods: OperationalPeriod[] = [];
  let hourOffset = -120; // Start T-120h (5 days before)

  const phases: Array<'planning' | 'preparation' | 'response' | 'recovery'> = [
    'planning', 'planning', 'planning', 'planning', // T-120 to T-72
    'preparation', 'preparation', 'preparation', 'preparation', // T-72 to T-24
    'response', 'response', // T-24 to Landfall
    'recovery', 'recovery' // Post-landfall
  ];

  for (let i = 0; i < 12; i++) {
    const startTime = `T${hourOffset}h`;
    const endTime = `T${hourOffset + 12}h`;
    const dayNum = Math.floor((120 + hourOffset) / 24) + 1;
    const period = hourOffset % 24 >= 0 && hourOffset % 24 < 12 ? 'AM' : 'PM';

    periods.push({
      id: `op-${i + 1}`,
      periodNumber: i + 1,
      startTime,
      endTime,
      label: `Day ${6 - dayNum} ${period} (${startTime} to ${endTime})`,
      phase: phases[i]
    });

    hourOffset += 12;
  }

  return periods;
}

// Generate mock injects for a period
function generateInjects(periodNumber: number): Inject[] {
  const templates = [
    { type: 'weather_update', title: 'NWS Forecast Update', severity: 'medium' },
    { type: 'forecast_change', title: 'Hurricane Track Shift', severity: 'high' },
    { type: 'media', title: 'Local News Coverage Intensifies', severity: 'low' },
    { type: 'infrastructure', title: 'Gas Stations Report Fuel Shortages', severity: 'medium' },
    { type: 'public_behavior', title: 'Traffic on Evacuation Routes Increasing', severity: 'medium' }
  ];

  const numInjects = Math.min(periodNumber, 3); // More injects as time progresses
  return templates.slice(0, numInjects).map((t, i) => ({
    id: `inject-${periodNumber}-${i}`,
    periodNumber,
    time: `T-${120 - (periodNumber - 1) * 12 - i * 4}h`,
    type: t.type as any,
    title: t.title,
    description: `Detailed information about ${t.title.toLowerCase()}`,
    severity: t.severity as any
  }));
}

// Generate mock EOC actions
function generateEOCActions(periodNumber: number): EOCAction[] {
  const actionTemplates: Record<number, EOCAction[]> = {
    2: [{
      id: `action-2-1`,
      periodNumber: 2,
      time: 'T-110h',
      actionType: 'public_announcement',
      details: 'Issue initial public awareness campaign about potential hurricane threat',
      targetPopulation: 'All residents'
    }],
    4: [{
      id: `action-4-1`,
      periodNumber: 4,
      time: 'T-85h',
      actionType: 'evacuation_order',
      zone: 'Zone A',
      urgency: 'voluntary',
      details: 'Issue voluntary evacuation order for coastal Zone A',
      targetPopulation: 'Coastal residents'
    }],
    6: [{
      id: `action-6-1`,
      periodNumber: 6,
      time: 'T-60h',
      actionType: 'shelter',
      details: 'Open primary emergency shelter at County High School (capacity: 500)',
      targetPopulation: 'General public'
    }],
    8: [
      {
        id: `action-8-1`,
        periodNumber: 8,
        time: 'T-38h',
        actionType: 'evacuation_order',
        zone: 'Zones A & B',
        urgency: 'mandatory',
        details: 'Mandatory evacuation for Zones A and B',
        targetPopulation: 'Low-lying and coastal areas'
      },
      {
        id: `action-8-2`,
        periodNumber: 8,
        time: 'T-36h',
        actionType: 'contraflow',
        details: 'Activate contraflow on I-95 Northbound',
        targetPopulation: 'Evacuating residents'
      }
    ],
    10: [{
      id: `action-10-1`,
      periodNumber: 10,
      time: 'T-10h',
      actionType: 'public_announcement',
      details: 'Final warning: Shelter in place if not yet evacuated',
      targetPopulation: 'All remaining residents'
    }]
  };

  return actionTemplates[periodNumber] || [];
}

// Generate mock persona responses
function generatePersonaResponses(periodNumber: number): PersonaResponse[] {
  const personaTypes = [
    'The Planner', 'The Skeptic', 'The Altruist', 'Resource Constrained',
    'The Elderly', 'Family First', 'Information Seeker', 'Community Leader',
    'Tech Savvy', 'The Traditional', 'The Optimist', 'The Anxious'
  ];

  const responses: PersonaResponse[] = [];

  // Generate ~50 personas (4-5 of each type)
  personaTypes.forEach((type, typeIndex) => {
    const count = typeIndex < 2 ? 5 : 4; // 5 for first two types, 4 for rest = 50 total

    for (let i = 0; i < count; i++) {
      const personaId = `${type.toLowerCase().replace(/\s+/g, '_')}_${i + 1}`;

      // Simulate progression: more evacuate as time goes on
      const evacuationThreshold = getEvacuationThreshold(type, periodNumber);
      const hasEvacuated = Math.random() < evacuationThreshold;

      responses.push({
        personaId,
        personaType: type,
        personaName: `${type} #${i + 1}`,
        decision: hasEvacuated ? 'evacuate' : (periodNumber > 8 ? 'shelter_in_place' : 'stay_home'),
        sentiment: getSentiment(type, periodNumber),
        reasoning: generateReasoning(type, periodNumber, hasEvacuated),
        actions: generateActions(type, hasEvacuated, periodNumber),
        concerns: generateConcerns(type, periodNumber),
        needsAssistance: type === 'Resource Constrained' || type === 'The Elderly',
        location: hasEvacuated ? 'evacuating' : 'home'
      });
    }
  });

  return responses;
}

function getEvacuationThreshold(type: string, period: number): number {
  const baseRates: Record<string, number> = {
    'The Planner': 0.9,
    'The Skeptic': 0.2,
    'The Altruist': 0.6,
    'Resource Constrained': 0.3,
    'The Elderly': 0.5,
    'Family First': 0.85,
    'Information Seeker': 0.7,
    'Community Leader': 0.75,
    'Tech Savvy': 0.65,
    'The Traditional': 0.6,
    'The Optimist': 0.3,
    'The Anxious': 0.8
  };

  // Increase over time
  const timeFactor = Math.min(period / 12, 1);
  return Math.min((baseRates[type] || 0.5) * timeFactor * 1.5, 1);
}

function getSentiment(type: string, period: number): PersonaResponse['sentiment'] {
  if (period < 4) return 'calm';
  if (period < 7) return type === 'The Anxious' ? 'anxious' : 'concerned';
  if (period < 10) return type === 'The Skeptic' ? 'skeptical' : 'anxious';
  return type === 'The Optimist' ? 'concerned' : 'panicked';
}

function generateReasoning(type: string, period: number, hasEvacuated: boolean): string {
  const reasoningMap: Record<string, string> = {
    'The Planner': hasEvacuated
      ? "I've been monitoring forecasts and following my prepared evacuation plan. Better to leave early and avoid traffic."
      : "Still monitoring situation, will evacuate if mandatory order issued.",
    'The Skeptic': hasEvacuated
      ? "I'm skeptical, but my family insisted. These forecasts are usually wrong."
      : "Not evacuating yet. They always exaggerate these storms.",
    'The Altruist': hasEvacuated
      ? "Checked on my elderly neighbors first. Now evacuating with them to ensure they're safe."
      : "Still making sure vulnerable neighbors have evacuation plans before I leave.",
    'Resource Constrained': hasEvacuated
      ? "Waited for free public transportation to shelter. Couldn't afford gas/hotel."
      : "Can't afford to evacuate. Hoping for public assistance or shelter.",
  };

  return reasoningMap[type] || "Monitoring the situation and following official guidance.";
}

function generateActions(type: string, hasEvacuated: boolean, period: number): string[] {
  if (hasEvacuated) {
    return ['Packed emergency supplies', 'Secured home', 'Departed for shelter/family'];
  }

  if (period > 8) {
    return ['Secured windows', 'Filled bathtub with water', 'Charged devices'];
  }

  return ['Monitoring weather', 'Preparing emergency kit', 'Making evacuation plans'];
}

function generateConcerns(type: string, period: number): string[] {
  const concerns = [
    'Storm surge flooding',
    'Power outages',
    'Running out of supplies',
    'Family safety',
    'Property damage'
  ];

  return concerns.slice(0, Math.min(period / 3, 3));
}

// Generate aggregates from persona responses
function calculateAggregates(responses: PersonaResponse[]): PeriodResult['aggregates'] {
  const decisions: Record<PersonaResponse['decision'], number> = {
    stay_home: 0, evacuate: 0, shelter_in_place: 0,
    help_neighbors: 0, gather_info: 0, wait_and_see: 0
  };

  const sentiments: Record<PersonaResponse['sentiment'], number> = {
    calm: 0, concerned: 0, anxious: 0, panicked: 0, skeptical: 0, defiant: 0
  };

  const locations: Record<PersonaResponse['location'], number> = {
    home: 0, evacuating: 0, shelter: 0, with_family: 0, helping_others: 0
  };

  let needingAssistance = 0;

  responses.forEach(r => {
    decisions[r.decision]++;
    sentiments[r.sentiment]++;
    locations[r.location]++;
    if (r.needsAssistance) needingAssistance++;
  });

  const criticalIssues: string[] = [];
  if (needingAssistance > 10) criticalIssues.push(`${needingAssistance} personas need assistance`);
  if (decisions.stay_home > 25 && responses.length > 0) {
    criticalIssues.push('High number of residents refusing to evacuate');
  }

  return {
    totalPersonas: responses.length,
    decisions,
    sentiments,
    locations,
    needingAssistance,
    criticalIssues
  };
}

// Generate full scenario results
function generateMockScenario(): ScenarioResults {
  const operationalPeriods = generateOperationalPeriods();

  const periodResults: PeriodResult[] = operationalPeriods.map(op => {
    const injects = generateInjects(op.periodNumber);
    const eocActions = generateEOCActions(op.periodNumber);
    const personaResponses = generatePersonaResponses(op.periodNumber);
    const aggregates = calculateAggregates(personaResponses);

    return {
      periodNumber: op.periodNumber,
      operationalPeriod: op,
      injects,
      eocActions,
      personaResponses,
      aggregates
    };
  });

  return {
    id: 'scenario-1',
    ttxScript: {
      id: 'ttx-1',
      name: 'Hurricane Category 4 - Miami-Dade',
      description: 'Major hurricane threatening South Florida with 48-hour lead time',
      scenarioType: 'hurricane',
      location: 'Miami-Dade County, FL',
      startTime: 'T-120h',
      endTime: 'T+24h',
      totalOperationalPeriods: 12
    },
    periodResults,
    createdAt: new Date(),
    status: 'completed',
    generationTime: 28
  };
}

export const useTTXStore = create<TTXStore>((set, get) => ({
  scenario: null,
  currentPeriod: 1,
  isGenerating: false,

  setScenario: (scenario) => set({ scenario }),

  setCurrentPeriod: (period) => {
    const { scenario } = get();
    if (scenario && period >= 1 && period <= scenario.periodResults.length) {
      set({ currentPeriod: period });
    }
  },

  generateScenario: async (actionPlan) => {
    set({ isGenerating: true });

    // Simulate 30-second generation time
    await new Promise(resolve => setTimeout(resolve, 2000)); // Using 2s for demo

    const scenario = generateMockScenario();
    set({ scenario, isGenerating: false, currentPeriod: 1 });
  },

  nextPeriod: () => {
    const { currentPeriod, scenario } = get();
    if (scenario && currentPeriod < scenario.periodResults.length) {
      set({ currentPeriod: currentPeriod + 1 });
    }
  },

  previousPeriod: () => {
    const { currentPeriod } = get();
    if (currentPeriod > 1) {
      set({ currentPeriod: currentPeriod - 1 });
    }
  }
}));

// Initialize with mock scenario for demo
useTTXStore.getState().setScenario(generateMockScenario());
