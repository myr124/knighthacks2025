import { create } from 'zustand';
import type { ScenarioResults, PeriodResult, OperationalPeriod, Inject, EOCAction, PersonaResponse, PersonaMapData } from '@/lib/types/ttx';
import { generatePersonaLocation, calculatePersonaPosition, getPersonaLocationStatus } from '@/lib/utils/personaPositions';
import { generatePersonaDemographics } from '@/lib/utils/personaDemographics';

interface TTXStoreV2 {
  scenario: ScenarioResults | null;
  personaLocationData: Map<string, PersonaMapData>;
  currentPeriod: number;
  isGenerating: boolean;
  isGeneratingSummaries: boolean;
  aiSummaries: Map<number, string>;
  selectedPersonaId: string | null;
  selectedEvent: Inject | EOCAction | null;
  interviewPersonaId: string | null;

  // Actions
  setScenario: (scenario: ScenarioResults) => void;
  setCurrentPeriod: (period: number) => void;
  generateScenario: (actionPlan: any) => Promise<void>;
  nextPeriod: () => void;
  previousPeriod: () => void;
  getPersonaHistory: (personaId: string) => PersonaResponse[];
  setSelectedPersona: (personaId: string | null) => void;
  setSelectedEvent: (event: Inject | EOCAction | null) => void;
  setInterviewPersona: (personaId: string | null) => void;
  initializeScenario: () => Promise<void>;
  generateSummaryForPeriod: (periodNumber: number) => Promise<void>;
}

// Persona types
const PERSONA_TYPES = [
  'The Planner', 'The Skeptic', 'The Altruist', 'Resource Constrained',
  'The Elderly', 'Family First', 'Information Seeker', 'Community Leader',
  'Tech Savvy', 'The Traditional', 'The Optimist', 'The Anxious'
];

// Generate all persona location data once
function generateAllPersonaLocations(): Map<string, PersonaMapData> {
  const locationMap = new Map<string, PersonaMapData>();
  let personaIndex = 0;

  PERSONA_TYPES.forEach((type, typeIndex) => {
    const count = typeIndex < 2 ? 5 : 4; // 5 for first two types, 4 for rest = 50 total

    for (let i = 0; i < count; i++) {
      const personaId = `${type.toLowerCase().replace(/\s+/g, '_')}_${i + 1}`;
      const locationData = generatePersonaLocation(type, personaIndex, 50);

      locationMap.set(personaId, {
        personaId,
        homeLocation: locationData.homeLocation,
        shelterLocation: locationData.shelterLocation,
        evacuationStartPeriod: locationData.evacuationStartPeriod,
        evacuationEndPeriod: locationData.evacuationEndPeriod
      });

      personaIndex++;
    }
  });

  return locationMap;
}

// Generate operational periods (same as before)
function generateOperationalPeriods(): OperationalPeriod[] {
  const periods: OperationalPeriod[] = [];
  let hourOffset = -120;

  const phases: Array<'planning' | 'preparation' | 'response' | 'recovery'> = [
    'planning', 'planning', 'planning', 'planning',
    'preparation', 'preparation', 'preparation', 'preparation',
    'response', 'response',
    'recovery', 'recovery'
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

// Generate injects
function generateInjects(periodNumber: number): Inject[] {
  const templates = [
    { type: 'weather_update', title: 'NWS Forecast Update', severity: 'medium' },
    { type: 'forecast_change', title: 'Hurricane Track Shift', severity: 'high' },
    { type: 'media', title: 'Local News Coverage Intensifies', severity: 'low' },
    { type: 'infrastructure', title: 'Gas Stations Report Fuel Shortages', severity: 'medium' },
    { type: 'public_behavior', title: 'Traffic on Evacuation Routes Increasing', severity: 'medium' }
  ];

  const numInjects = Math.min(periodNumber, 3);
  return templates.slice(0, numInjects).map((t, i) => ({
    eventType: 'inject',
    id: `inject-${periodNumber}-${i}`,
    periodNumber,
    time: `T-${120 - (periodNumber - 1) * 12 - i * 4}h`,
    type: t.type as any,
    title: t.title,
    description: `Detailed information about ${t.title.toLowerCase()}`,
    severity: t.severity as any
  }));
}

// Generate EOC actions
function generateEOCActions(periodNumber: number): EOCAction[] {
  const actionTemplates: Record<number, EOCAction[]> = {
    2: [{
      eventType: 'eocAction', id: `action-2-1`, periodNumber: 2, time: 'T-110h',
      actionType: 'public_announcement',
      details: 'Issue initial public awareness campaign about potential hurricane threat',
      targetPopulation: 'All residents'
    }],
    4: [{
      eventType: 'eocAction', id: `action-4-1`, periodNumber: 4, time: 'T-85h',
      actionType: 'evacuation_order', zone: 'Zone A', urgency: 'voluntary',
      details: 'Issue voluntary evacuation order for coastal Zone A',
      targetPopulation: 'Coastal residents'
    }],
    6: [{
      eventType: 'eocAction', id: `action-6-1`, periodNumber: 6, time: 'T-60h',
      actionType: 'shelter',
      details: 'Open primary emergency shelter at County High School (capacity: 500)',
      targetPopulation: 'General public'
    }],
    8: [
      {
        eventType: 'eocAction', id: `action-8-1`, periodNumber: 8, time: 'T-38h',
        actionType: 'evacuation_order', zone: 'Zones A & B', urgency: 'mandatory',
        details: 'Mandatory evacuation for Zones A and B',
        targetPopulation: 'Low-lying and coastal areas'
      },
      {
        eventType: 'eocAction', id: `action-8-2`, periodNumber: 8, time: 'T-36h',
        actionType: 'contraflow',
        details: 'Activate contraflow on I-95 Northbound',
        targetPopulation: 'Evacuating residents'
      }
    ],
    10: [{
      eventType: 'eocAction', id: `action-10-1`, periodNumber: 10, time: 'T-10h',
      actionType: 'public_announcement',
      details: 'Final warning: Shelter in place if not yet evacuated',
      targetPopulation: 'All remaining residents'
    }]
  };

  return actionTemplates[periodNumber] || [];
}

// Generate persona responses with positions
function generatePersonaResponses(
  periodNumber: number,
  locationMap: Map<string, PersonaMapData>
): PersonaResponse[] {
  const responses: PersonaResponse[] = [];

  PERSONA_TYPES.forEach((type, typeIndex) => {
    const count = typeIndex < 2 ? 5 : 4;

    for (let i = 0; i < count; i++) {
      const personaId = `${type.toLowerCase().replace(/\s+/g, '_')}_${i + 1}`;
      const locationData = locationMap.get(personaId)!;

      // Calculate position for this period
      const position = calculatePersonaPosition(locationData, periodNumber);
      const locationStatus = getPersonaLocationStatus(locationData, periodNumber);

      // Determine decision based on location status
      let decision: PersonaResponse['decision'];
      if (locationStatus === 'home') {
        decision = periodNumber > 8 ? 'shelter_in_place' : 'stay_home';
      } else if (locationStatus === 'evacuating') {
        decision = 'evacuate';
      } else {
        decision = 'shelter_in_place'; // At shelter
      }

      responses.push({
        personaId,
        personaType: type,
        personaName: `${type} #${i + 1}`,
        demographics: generatePersonaDemographics(type, i),
        decision,
        sentiment: getSentiment(type, periodNumber),
        reasoning: generateReasoning(type, locationStatus, periodNumber),
        actions: generateActions(locationStatus, periodNumber),
        concerns: generateConcerns(periodNumber),
        needsAssistance: type === 'Resource Constrained' || type === 'The Elderly',
        location: locationStatus === 'shelter' ? 'shelter' : locationStatus,
        position
      });
    }
  });

  return responses;
}

function getSentiment(type: string, period: number): PersonaResponse['sentiment'] {
  if (period < 4) return 'calm';
  if (period < 7) return type === 'The Anxious' ? 'anxious' : 'concerned';
  if (period < 10) return type === 'The Skeptic' ? 'skeptical' : 'anxious';
  return type === 'The Optimist' ? 'concerned' : 'panicked';
}

function generateReasoning(type: string, locationStatus: string, period: number): string {
  const reasoningMap: Record<string, Record<string, string>> = {
    'The Planner': {
      home: "Monitoring forecasts closely. Will evacuate according to my prepared plan.",
      evacuating: "Following my evacuation plan. Left early to avoid traffic congestion.",
      shelter: "Arrived at shelter safely. Glad I evacuated early as planned."
    },
    'The Skeptic': {
      home: "Not convinced this storm will be as bad as they say. Staying put for now.",
      evacuating: "Family pressured me to leave. Still think they're overreacting.",
      shelter: "At shelter now, but I bet this storm will fizzle out."
    },
    'The Altruist': {
      home: "Checking on vulnerable neighbors before I evacuate.",
      evacuating: "Helping my elderly neighbor evacuate with me.",
      shelter: "Made sure my neighbors got here safely before settling in."
    }
  };

  return reasoningMap[type]?.[locationStatus] || "Following emergency management guidance.";
}

function generateActions(locationStatus: string, period: number): string[] {
  if (locationStatus === 'shelter') {
    return ['Checked into shelter', 'Settled in assigned space', 'Connected with shelter staff'];
  }

  if (locationStatus === 'evacuating') {
    return ['Loaded vehicle with supplies', 'Departed home', 'En route to shelter'];
  }

  if (period > 8) {
    return ['Secured windows', 'Filled bathtub with water', 'Charged devices'];
  }

  return ['Monitoring weather', 'Preparing emergency kit', 'Making evacuation plans'];
}

function generateConcerns(period: number): string[] {
  const allConcerns = [
    'Storm surge flooding',
    'Power outages',
    'Running out of supplies',
    'Family safety',
    'Property damage',
    'Traffic congestion',
    'Shelter capacity'
  ];

  return allConcerns.slice(0, Math.min(Math.floor(period / 2), 4));
}

// Calculate aggregates
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
  if (decisions.stay_home > 25) {
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

// Generate full scenario
function generateMockScenario(locationMap: Map<string, PersonaMapData>): ScenarioResults {
  const operationalPeriods = generateOperationalPeriods();

  const periodResults: PeriodResult[] = operationalPeriods.map(op => {
    const injects = generateInjects(op.periodNumber);
    const eocActions = generateEOCActions(op.periodNumber);
    const personaResponses = generatePersonaResponses(op.periodNumber, locationMap);
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
      description: 'Major hurricane threatening South Florida',
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

export const useTTXStoreV2 = create<TTXStoreV2>((set, get) => {
  const locationMap = generateAllPersonaLocations();

  return {
    scenario: null,
    personaLocationData: locationMap,
    currentPeriod: 1,
    isGenerating: false,
    isGeneratingSummaries: false,
    aiSummaries: new Map<number, string>(),
    selectedPersonaId: null,
    selectedEvent: null,
    interviewPersonaId: null,

    setScenario: (scenario) => set({ scenario }),

    setCurrentPeriod: (period) => {
      const { scenario } = get();
      if (scenario && period >= 1 && period <= scenario.periodResults.length) {
        set({ currentPeriod: period });
      }
    },

    generateScenario: async (actionPlan) => {
      set({ isGenerating: true, isGeneratingSummaries: false });

      try {
        const response = await fetch('/api/ttx/generate-scenario', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            scenarioId: 'scenario-1',
            scenarioType: 'hurricane',
            location: 'Orlando, FL',
            actionPlan: actionPlan || {
              periods: Array.from({ length: 12 }, (_, i) => ({
                periodNumber: i + 1,
                injects: [],
                actions: []
              }))
            }
          }),
        });

        if (!response.ok) {
          throw new Error(`API responded with status ${response.status}`);
        }

        const scenario = await response.json();
        set({ scenario, isGenerating: false, currentPeriod: 1 });

      } catch (error) {
        console.error('Error generating scenario:', error);
        set({ isGenerating: false, isGeneratingSummaries: false });

        // Fallback to local mock generation if API fails
        console.log('Falling back to local mock generation...');
        const scenario = generateMockScenario(get().personaLocationData);
        set({ scenario, isGenerating: false, currentPeriod: 1 });
      }
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
    },

    getPersonaHistory: (personaId: string) => {
      const { scenario } = get();
      if (!scenario) return [];

      return scenario.periodResults.map(result =>
        result.personaResponses.find(r => r.personaId === personaId)!
      );
    },

    setSelectedPersona: (personaId: string | null) => set({ selectedPersonaId: personaId }),

    setSelectedEvent: (event: Inject | EOCAction | null) => set({ selectedEvent: event }),

    setInterviewPersona: (personaId: string | null) => set({ interviewPersonaId: personaId }),

    initializeScenario: async () => {
      get().generateScenario(null);
    },

    generateSummaryForPeriod: async (periodNumber: number) => {
      set({ isGeneratingSummaries: true });
      const { scenario, aiSummaries } = get();

      if (!scenario) {
        set({ isGeneratingSummaries: false });
        return;
      }

      const periodResult = scenario.periodResults.find(pr => pr.periodNumber === periodNumber);

      if (!periodResult) {
        set({ isGeneratingSummaries: false });
        return;
      }

      try {
        const summaryResponse = await fetch('/api/ttx/generate-summary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            periodNumber: periodResult.periodNumber,
            personaResponses: periodResult.personaResponses,
            criticalIssues: periodResult.aggregates.criticalIssues,
            injects: periodResult.injects,
            eocActions: periodResult.eocActions,
          }),
        });

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          const newAiSummaries = new Map(aiSummaries);
          newAiSummaries.set(periodNumber, summaryData.summary);
          set({ aiSummaries: newAiSummaries });
        } else {
          console.error(`Failed to generate summary for period ${periodNumber}`);
          const newAiSummaries = new Map(aiSummaries);
          newAiSummaries.set(periodNumber, 'Error generating summary.');
          set({ aiSummaries: newAiSummaries });
        }
      } catch (error) {
        console.error(`Error calling generate-summary for period ${periodNumber}:`, error);
        const newAiSummaries = new Map(aiSummaries);
        newAiSummaries.set(periodNumber, 'Error generating summary.');
        set({ aiSummaries: newAiSummaries });
      } finally {
        set({ isGeneratingSummaries: false });
      }
    },
  };
});



// Start initialization
// initializeScenario();
useTTXStoreV2.getState().initializeScenario();
