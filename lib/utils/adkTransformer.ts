import type { ScenarioResults, PeriodResult, PersonaResponse, PersonaDemographics, Inject, EOCAction, OperationalPeriod } from '@/lib/types/ttx';
import { generatePersonaLocation, calculatePersonaPosition } from './personaPositions';

// ADK Backend response format
interface ADKPersona {
  race: string;
  age: number;
  sex: string;
  bio: string;
  representation: number;
  response: Array<{
    decision: string;
    sentiment: string;
    location: string;
    actions_taken: string[];
    personality_reasoning: string;
  }>;
}

interface ADKResponse {
  author: string;
  content: {
    parts: Array<{
      text: string;
    }>;
  };
  actions?: {
    stateDelta?: Record<string, ADKPersona>;
  };
}

// Persona type mapping from author ID
const PERSONA_TYPE_MAP: Record<string, string> = {
  lowincome: 'Low Income Resident',
  middleclass: 'Middle Class Family',
  highincome: 'High Income Professional',
  retired: 'Retired Senior',
  student: 'College Student',
  underemployed: 'Underemployed Worker'
};

function inferPersonaType(authorId: string): string {
  const prefix = authorId.split('_')[0];
  return PERSONA_TYPE_MAP[prefix] || 'Resident';
}

function generatePersonaName(authorId: string, bio: string): string {
  const type = inferPersonaType(authorId);
  const number = authorId.split('_')[1] || '1';
  return `${type} #${number}`;
}

// Map ADK decision to frontend decision type
function mapDecision(adkDecision: string): PersonaResponse['decision'] {
  const decisionMap: Record<string, PersonaResponse['decision']> = {
    'stay_home': 'stay_home',
    'evacuate': 'evacuate',
    'shelter_in_place': 'shelter_in_place',
    'help_neighbors': 'help_neighbors',
    'gather_info': 'gather_info',
    'wait_and_see': 'wait_and_see'
  };
  return decisionMap[adkDecision] || 'stay_home';
}

// Map ADK sentiment to frontend sentiment type
function mapSentiment(adkSentiment: string): PersonaResponse['sentiment'] {
  const sentimentMap: Record<string, PersonaResponse['sentiment']> = {
    'calm': 'calm',
    'concerned': 'concerned',
    'anxious': 'anxious',
    'panicked': 'panicked',
    'skeptical': 'skeptical',
    'defiant': 'defiant'
  };
  return sentimentMap[adkSentiment] || 'calm';
}

// Map ADK location to frontend location type
function mapLocation(adkLocation: string): PersonaResponse['location'] {
  const locationMap: Record<string, PersonaResponse['location']> = {
    'home': 'home',
    'evacuating': 'evacuating',
    'shelter': 'shelter',
    'with_family': 'with_family',
    'helping_others': 'helping_others'
  };
  return locationMap[adkLocation] || 'home';
}

// Extract demographics from ADK data
function extractDemographics(adkPersona: ADKPersona, authorId: string): PersonaDemographics {
  const { age, race, sex, bio } = adkPersona;

  // Infer social status from bio and author ID
  let socialStatus: PersonaDemographics['socialStatus'] = 'middle_income';
  if (authorId.includes('lowincome') || authorId.includes('underemployed')) {
    socialStatus = 'low_income';
  } else if (authorId.includes('highincome')) {
    socialStatus = 'high_income';
  }

  // Infer education from bio
  let educationLevel: PersonaDemographics['educationLevel'] = 'high_school';
  if (bio.toLowerCase().includes('college') || bio.toLowerCase().includes('university')) {
    educationLevel = 'bachelors';
  } else if (bio.toLowerCase().includes('graduate') || bio.toLowerCase().includes('phd')) {
    educationLevel = 'graduate';
  } else if (bio.toLowerCase().includes('some college')) {
    educationLevel = 'some_college';
  }

  // Infer trust from persona type
  let trustInGovernment: PersonaDemographics['trustInGovernment'] = 'medium';
  if (authorId.includes('retired')) {
    trustInGovernment = 'high';
  } else if (authorId.includes('lowincome') || authorId.includes('underemployed')) {
    trustInGovernment = 'low';
  }

  // Map race
  const raceMap: Record<string, PersonaDemographics['race']> = {
    'Black': 'black',
    'White': 'white',
    'Hispanic': 'hispanic',
    'Asian': 'asian'
  };
  const mappedRace = raceMap[race] || 'other';

  return {
    age,
    race: mappedRace,
    socialStatus,
    politicalLeaning: 'moderate',
    trustInGovernment,
    educationLevel,
    householdSize: bio.includes('Lives alone') ? 1 : 3,
    hasChildren: bio.toLowerCase().includes('child') || bio.toLowerCase().includes('kid'),
    hasVehicle: bio.includes('car') || bio.includes('vehicle') || bio.includes('Toyota') || bio.includes('Honda'),
    homeOwnership: bio.includes('rent') ? 'rent' : 'own'
  };
}

// Extract concerns from reasoning text
function extractConcerns(reasoning: string): string[] {
  const concerns: string[] = [];
  const lowercaseReasoning = reasoning.toLowerCase();

  if (lowercaseReasoning.includes('flood') || lowercaseReasoning.includes('surge')) {
    concerns.push('Storm surge flooding');
  }
  if (lowercaseReasoning.includes('power') || lowercaseReasoning.includes('electric')) {
    concerns.push('Power outages');
  }
  if (lowercaseReasoning.includes('insulin') || lowercaseReasoning.includes('medication') || lowercaseReasoning.includes('medical')) {
    concerns.push('Medical needs');
  }
  if (lowercaseReasoning.includes('family') || lowercaseReasoning.includes('children')) {
    concerns.push('Family safety');
  }
  if (lowercaseReasoning.includes('property') || lowercaseReasoning.includes('damage') || lowercaseReasoning.includes('home')) {
    concerns.push('Property damage');
  }
  if (lowercaseReasoning.includes('traffic') || lowercaseReasoning.includes('road')) {
    concerns.push('Traffic congestion');
  }
  if (lowercaseReasoning.includes('supplies') || lowercaseReasoning.includes('food') || lowercaseReasoning.includes('water')) {
    concerns.push('Running out of supplies');
  }

  return concerns.slice(0, 4); // Limit to 4 concerns
}

// Generate operational periods for a specific count
function generateOperationalPeriodsForCount(count: number): OperationalPeriod[] {
  const periods: OperationalPeriod[] = [];
  let hourOffset = -120;

  // Define phases dynamically based on count
  // Roughly: first 30% planning, next 30% preparation, next 30% response, last 10% recovery
  const getPhase = (index: number, total: number): 'planning' | 'preparation' | 'response' | 'recovery' => {
    const ratio = index / total;
    if (ratio < 0.3) return 'planning';
    if (ratio < 0.6) return 'preparation';
    if (ratio < 0.9) return 'response';
    return 'recovery';
  };

  for (let i = 0; i < count; i++) {
    const startTime = `T${hourOffset >= 0 ? '+' : ''}${hourOffset}h`;
    const endTime = `T${hourOffset + 12 >= 0 ? '+' : ''}${hourOffset + 12}h`;
    const phase = getPhase(i, count);

    periods.push({
      id: `op-${i + 1}`,
      periodNumber: i + 1,
      startTime,
      endTime,
      label: `Period ${i + 1} (${startTime} to ${endTime})`,
      phase
    });

    hourOffset += 12;
  }

  return periods;
}

// Generate operational periods (default 13)
function generateOperationalPeriods(): OperationalPeriod[] {
  return generateOperationalPeriodsForCount(13);
}

// Generate placeholder injects (simplified - you can enhance these)
function generateInjects(periodNumber: number): Inject[] {
  if (periodNumber > 8) return [];

  const templates = [
    { type: 'weather_update' as const, title: 'NWS Forecast Update', severity: 'medium' as const },
    { type: 'forecast_change' as const, title: 'Hurricane Track Adjustment', severity: 'high' as const },
    { type: 'media' as const, title: 'Local News Coverage', severity: 'low' as const },
  ];

  const numInjects = Math.min(Math.floor(periodNumber / 2), 2);
  return templates.slice(0, numInjects).map((t, i) => ({
    eventType: 'inject' as const,
    id: `inject-${periodNumber}-${i}`,
    periodNumber,
    time: `T-${120 - (periodNumber - 1) * 12 - i * 4}h`,
    type: t.type,
    title: t.title,
    description: `Detailed information about ${t.title.toLowerCase()}`,
    severity: t.severity
  }));
}

// Generate EOC actions
function generateEOCActions(periodNumber: number): EOCAction[] {
  const actionTemplates: Record<number, EOCAction[]> = {
    4: [{
      eventType: 'eocAction', id: `action-4-1`, periodNumber: 4, time: 'T-85h',
      actionType: 'evacuation_order', zone: 'Zone A', urgency: 'voluntary',
      details: 'Issue voluntary evacuation order for coastal Zone A',
      targetPopulation: 'Coastal residents'
    }],
    6: [{
      eventType: 'eocAction', id: `action-6-1`, periodNumber: 6, time: 'T-60h',
      actionType: 'shelter',
      details: 'Open emergency shelters',
      targetPopulation: 'General public'
    }],
    8: [{
      eventType: 'eocAction', id: `action-8-1`, periodNumber: 8, time: 'T-38h',
      actionType: 'evacuation_order', zone: 'All Zones', urgency: 'mandatory',
      details: 'Mandatory evacuation for all zones',
      targetPopulation: 'All residents in evacuation zones'
    }]
  };

  return actionTemplates[periodNumber] || [];
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
  if (needingAssistance > 5) {
    criticalIssues.push(`${needingAssistance} individuals need assistance`);
  }
  if (decisions.stay_home > 10) {
    criticalIssues.push('Significant number of residents not evacuating');
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

/**
 * Transform ADK backend response to frontend ScenarioResults format
 * Handles the actual ADK backend structure with list_sessions and state
 */
export function transformADKToScenarioResults(adkData: any): ScenarioResults {
  console.log('🔄 Starting ADK transformation...');

  // Extract persona data from the actual ADK structure
  const personas: Array<{ authorId: string; data: ADKPersona }> = [];

  // Check if this is the new format with list_sessions
  if (adkData.list_sessions && Array.isArray(adkData.list_sessions)) {
    console.log('📋 Found list_sessions format');

    // Find the session with state data (usually the last one with populated state)
    const sessionWithState = adkData.list_sessions.find((session: any) =>
      session.state && Object.keys(session.state).length > 0
    );

    if (sessionWithState && sessionWithState.state) {
      console.log('✅ Found session with state, processing personas...');
      console.log('👥 Persona keys:', Object.keys(sessionWithState.state));

      // Extract each persona from the state object
      Object.entries(sessionWithState.state).forEach(([personaKey, personaData]: [string, any]) => {
        if (personaData && personaData.response && Array.isArray(personaData.response)) {
          personas.push({
            authorId: personaKey,
            data: personaData as ADKPersona
          });
          console.log(`  ✓ Loaded persona: ${personaKey} with ${personaData.response.length} responses`);
        }
      });
    } else {
      console.warn('⚠️  No session with state data found');
    }
  }
  // Fallback: try old format with array of ADKResponse
  else if (Array.isArray(adkData)) {
    console.log('📋 Found array format (old ADK structure)');

    for (const item of adkData) {
      if (item.author === 'merger_agent') continue;

      // Try to parse from actions.stateDelta first, then content
      let personaData: ADKPersona | null = null;

      if (item.actions?.stateDelta) {
        const key = Object.keys(item.actions.stateDelta)[0];
        if (key) {
          personaData = item.actions.stateDelta[key];
        }
      }

      if (!personaData && item.content?.parts?.[0]?.text) {
        try {
          personaData = JSON.parse(item.content.parts[0].text);
        } catch (e) {
          console.warn(`Failed to parse persona data for ${item.author}:`, e);
        }
      }

      if (personaData) {
        personas.push({ authorId: item.author, data: personaData });
      }
    }
  } else {
    console.error('❌ Unknown ADK data format:', adkData);
  }

  console.log(`📊 Total personas loaded: ${personas.length}`);

  // Determine the number of periods from the personas
  // Use the maximum response array length from all personas
  const maxPeriods = personas.reduce((max, persona) => {
    const responseLength = persona.data.response?.length || 0;
    return Math.max(max, responseLength);
  }, 0);

  console.log(`📅 Max periods found in persona responses: ${maxPeriods}`);

  // Generate location data for each persona
  const locationMap = new Map();
  personas.forEach((persona, index) => {
    const locationData = generatePersonaLocation(
      inferPersonaType(persona.authorId),
      index,
      personas.length
    );
    locationMap.set(persona.authorId, locationData);
  });

  // Generate operational periods based on actual response count
  const operationalPeriods = generateOperationalPeriodsForCount(maxPeriods);

  // Build period results
  const periodResults: PeriodResult[] = operationalPeriods.map(op => {
    const personaResponses: PersonaResponse[] = [];

    personas.forEach((persona) => {
      const { authorId, data } = persona;
      const periodIndex = op.periodNumber - 1;

      // Check if this persona has a response for this period
      if (!data.response || periodIndex >= data.response.length) {
        console.warn(`⚠️  Persona ${authorId} has no response for period ${op.periodNumber} (has ${data.response?.length || 0} responses)`);

        // Use last available response as fallback, or skip if no responses at all
        if (!data.response || data.response.length === 0) {
          return;
        }

        // Use the last response they have as a fallback
        const lastResponse = data.response[data.response.length - 1];
        const locationData = locationMap.get(authorId);
        const position = calculatePersonaPosition(locationData, op.periodNumber);
        const demographics = extractDemographics(data, authorId);

        personaResponses.push({
          personaId: authorId,
          personaType: inferPersonaType(authorId),
          personaName: generatePersonaName(authorId, data.bio),
          bio: data.bio,
          demographics,
          decision: mapDecision(lastResponse.decision),
          sentiment: mapSentiment(lastResponse.sentiment),
          reasoning: lastResponse.personality_reasoning + ' [Using last available response]',
          actions: lastResponse.actions_taken,
          concerns: extractConcerns(lastResponse.personality_reasoning),
          needsAssistance: authorId.includes('lowincome') || authorId.includes('retired') || authorId.includes('underemployed'),
          location: mapLocation(lastResponse.location),
          position
        });
        return;
      }

      const adkResponse = data.response[periodIndex];
      const locationData = locationMap.get(authorId);
      const position = calculatePersonaPosition(locationData, op.periodNumber);
      const demographics = extractDemographics(data, authorId);

      personaResponses.push({
        personaId: authorId,
        personaType: inferPersonaType(authorId),
        personaName: generatePersonaName(authorId, data.bio),
        bio: data.bio, // Include bio from ADK data
        demographics,
        decision: mapDecision(adkResponse.decision),
        sentiment: mapSentiment(adkResponse.sentiment),
        reasoning: adkResponse.personality_reasoning,
        actions: adkResponse.actions_taken,
        concerns: extractConcerns(adkResponse.personality_reasoning),
        needsAssistance: authorId.includes('lowincome') || authorId.includes('retired') || authorId.includes('underemployed'),
        location: mapLocation(adkResponse.location),
        position
      });
    });

    const injects = generateInjects(op.periodNumber);
    const eocActions = generateEOCActions(op.periodNumber);
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

  console.log(`✅ Transformation complete: ${periodResults.length} periods, ${personas.length} personas`);

  return {
    id: `scenario-adk-${Date.now()}`,
    ttxScript: {
      id: 'ttx-adk-1',
      name: 'Hurricane Scenario - ADK Generated',
      description: 'Hurricane scenario with real ADK-generated persona responses',
      scenarioType: 'hurricane',
      location: 'Orlando, FL',
      startTime: 'T-120h',
      endTime: `T+${(maxPeriods * 12) - 120}h`,
      totalOperationalPeriods: maxPeriods
    },
    periodResults,
    createdAt: new Date(),
    status: 'completed',
    generationTime: 0
  };
}
