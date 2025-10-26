import { NextRequest, NextResponse } from 'next/server';

export interface OperationalPeriod {
  id: string;
  periodNumber: number; // 1-12
  startTime: string; // "T-120h"
  endTime: string; // "T-108h"
  label: string; // "Day 5 AM (T-120h to T-108h)"
  phase: 'planning' | 'preparation' | 'response' | 'recovery';
}

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

export interface PersonaResponse {
  personaId: string;
  personaType: string;
  personaName: string;
  bio?: string; // Background story/description from ADK
  demographics: any;
  decision: 'stay_home' | 'evacuate' | 'shelter_in_place' | 'help_neighbors' | 'gather_info' | 'wait_and_see';
  sentiment: 'calm' | 'concerned' | 'anxious' | 'panicked' | 'skeptical' | 'defiant';
  reasoning: string; // AI-generated explanation from ADK
  actions: string[]; // Specific actions taken
  concerns: string[]; // Worries/fears
  needsAssistance: boolean;
  location: 'home' | 'evacuating' | 'shelter' | 'with_family' | 'helping_others';
  position: {
    lat: number;
    lng: number;
  };
}

export interface Inject {
  eventType: 'inject';
  id: string;
  periodNumber: number;
  time: string; // "T-115h" (relative to landfall)
  type: 'weather_update' | 'forecast_change' | 'infrastructure' | 'media' | 'public_behavior';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface EOCAction {
  eventType: 'eocAction';
  id: string;
  periodNumber: number;
  time: string; // "T-118h"
  actionType: 'evacuation_order' | 'shelter' | 'contraflow' | 'public_announcement' | 'resource_deployment';
  zone?: string;
  urgency?: 'voluntary' | 'mandatory';
  details: string;
  targetPopulation?: string;
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

function calculateAggregates(responses: PersonaResponse[]) {
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

export async function POST(request: NextRequest) {
  try {
    // Check if we should use test.json data
    if (process.env.USE_TEST_JSON === 'true') {
      console.log('Using test.json data (USE_TEST_JSON=true)');

      // Forward to mock API route
      const baseUrl = request.nextUrl.origin;
      const mockResponse = await fetch(`${baseUrl}/api/ttx/mock`, {
        method: 'GET',
      });

      if (!mockResponse.ok) {
        throw new Error(`Mock API responded with status ${mockResponse.status}`);
      }

      const result = await mockResponse.json();
      return NextResponse.json(result);
    }

    const payload = await request.json();

    // Validate required fields
    if (!payload.scenarioId || !payload.scenarioType || !payload.location || !payload.actionPlan) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if ADK backend URL is configured
    const ADK_BACKEND_URL = process.env.ADK_BACKEND_URL;

    if (ADK_BACKEND_URL) {
      console.log('Using live ADK backend:', ADK_BACKEND_URL);

      // Production: Forward to ADK backend
      const response = await fetch(ADK_BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`ADK backend responded with status ${response.status}`);
      }

      const result = await response.json();
      return NextResponse.json(result);
    }

    // Fallback: Development mode with generated mock data
    console.log('Development mode: Using generated mock data (no ADK_BACKEND_URL or USE_TEST_JSON)');

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    const operationalPeriods = generateOperationalPeriods();

    // Return mock response matching ADK spec
    const mockResponse = {
      scenarioId: payload.scenarioId,
      generationTime: 28.4,
      status: 'completed',
      periodResults: payload.actionPlan.periods.map((period: any, index: number) => {
        const personaResponses = generateMockPersonaResponses(period, index);
        const aggregates = calculateAggregates(personaResponses);
        const injects = generateInjects(period.periodNumber);
        const eocActions = generateEOCActions(period.periodNumber);
        return {
          periodNumber: period.periodNumber,
          operationalPeriod: operationalPeriods[index],
          personaResponses,
          aggregates,
          injects,
          eocActions
        }
      })
    };

    return NextResponse.json(mockResponse);

  } catch (error) {
    console.error('Error generating scenario:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate scenario',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Mock persona response generator for development
function generateMockPersonaResponses(period: any, periodIndex: number) {
  const personaTypes = [
    { type: 'The Planner', count: 5 },
    { type: 'The Skeptic', count: 5 },
    { type: 'The Altruist', count: 4 },
    { type: 'Resource Constrained', count: 4 },
    { type: 'The Elderly', count: 4 },
    { type: 'Family First', count: 4 },
    { type: 'Information Seeker', count: 4 },
    { type: 'Community Leader', count: 4 },
    { type: 'Tech Savvy', count: 4 },
    { type: 'The Traditional', count: 4 },
    { type: 'The Optimist', count: 4 },
    { type: 'The Anxious', count: 4 }
  ];

  const responses = [];

  for (const { type, count } of personaTypes) {
    for (let i = 1; i <= count; i++) {
      const personaId = `${type.toLowerCase().replace(/\s+/g, '_')}_${i}`;

      responses.push({
        personaId,
        personaType: type,
        personaName: `${type} #${i}`,
        demographics: generateMockDemographics(type),
        decision: generateMockDecision(type, periodIndex),
        sentiment: generateMockSentiment(periodIndex),
        reasoning: `Mock reasoning for ${type} in period ${period.periodNumber}. This persona is responding to the current situation based on their characteristics.`,
        actions: [
          'Mock action 1',
          'Mock action 2',
          'Mock action 3'
        ],
        concerns: [
          'Mock concern 1',
          'Mock concern 2'
        ],
        needsAssistance: type === 'Resource Constrained' || type === 'The Elderly',
        location: generateMockLocation(periodIndex),
        position: {
          lat: 25.7617 + (Math.random() - 0.5) * 0.1,
          lng: -80.1918 + (Math.random() - 0.5) * 0.1
        }
      });
    }
  }

  return responses;
}

function generateMockDemographics(personaType: string) {
  const baseDemo = {
    age: 35,
    race: 'white' as const,
    socialStatus: 'middle_income' as const,
    politicalLeaning: 'moderate' as const,
    trustInGovernment: 'medium' as const,
    educationLevel: 'bachelors' as const,
    householdSize: 2,
    hasChildren: false,
    hasVehicle: true,
    homeOwnership: 'own' as const
  };

  // Customize based on persona type
  if (personaType === 'Resource Constrained') {
    return { ...baseDemo, socialStatus: 'low_income' as const, hasVehicle: false, homeOwnership: 'rent' as const };
  }
  if (personaType === 'The Elderly') {
    return { ...baseDemo, age: 72, trustInGovernment: 'high' as const };
  }
  if (personaType === 'The Skeptic') {
    return { ...baseDemo, trustInGovernment: 'low' as const };
  }

  return baseDemo;
}

function generateMockDecision(personaType: string, periodIndex: number): 'stay_home' | 'evacuate' | 'shelter_in_place' | 'help_neighbors' | 'gather_info' | 'wait_and_see' {
  if (periodIndex < 3) return 'stay_home';
  if (periodIndex < 6) return personaType === 'The Skeptic' ? 'wait_and_see' : 'gather_info';
  if (periodIndex < 9) return personaType === 'The Planner' ? 'evacuate' : 'stay_home';
  return 'shelter_in_place';
}

function generateMockSentiment(periodIndex: number): 'calm' | 'concerned' | 'anxious' | 'panicked' | 'skeptical' | 'defiant' {
  if (periodIndex < 3) return 'calm';
  if (periodIndex < 6) return 'concerned';
  if (periodIndex < 9) return 'anxious';
  return 'panicked';
}

function generateMockLocation(periodIndex: number): string {
  if (periodIndex < 6) return 'home';
  if (periodIndex < 9) return 'evacuating';
  return 'shelter';
}
