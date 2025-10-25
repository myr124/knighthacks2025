import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Validate required fields
    if (!payload.scenarioId || !payload.scenarioType || !payload.location || !payload.actionPlan) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual ADK backend URL
    const ADK_BACKEND_URL = process.env.ADK_BACKEND_URL || 'http://localhost:8000/api/ttx/generate-scenario';

    // For development, simulate the backend response
    if (process.env.NODE_ENV === 'development' && !process.env.ADK_BACKEND_URL) {
      console.log('Development mode: Simulating backend response...');

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Return mock response matching ADK spec
      const mockResponse = {
        scenarioId: payload.scenarioId,
        generationTime: 28.4,
        status: 'completed',
        periodResults: payload.actionPlan.periods.map((period: any, index: number) => ({
          periodNumber: period.periodNumber,
          personaResponses: generateMockPersonaResponses(period, index)
        }))
      };

      return NextResponse.json(mockResponse);
    }

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

function generateMockDecision(personaType: string, periodIndex: number): string {
  if (periodIndex < 3) return 'stay_home';
  if (periodIndex < 6) return personaType === 'The Skeptic' ? 'wait_and_see' : 'gather_info';
  if (periodIndex < 9) return personaType === 'The Planner' ? 'evacuate' : 'stay_home';
  return 'shelter_in_place';
}

function generateMockSentiment(periodIndex: number): string {
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
