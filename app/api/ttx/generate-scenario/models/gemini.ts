export interface ScenarioRequest {
  scenarioType: 'hurricane' | 'epidemic' | 'wildfire' | 'flood' | 'earthquake';
  location: string;
  severity: string;
  population: number;
  agents: number;
  time?: number;
}

export interface Inject {
  id: string;
  time: string;
  type: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface EOCAction {
  id: string;
  time: string;
  actionType: string;
  details: string;
  targetPopulation: string;
  urgency?: 'voluntary' | 'mandatory';
  zone?: string;
}

export interface OperationalPeriod {
  periodNumber: number;
  startTime: string;
  endTime: string;
  phase: 'planning' | 'preparation' | 'response' | 'recovery';
  injects: Inject[];
  eocActions: EOCAction[];
}

export interface ActionPlan {
  periods: OperationalPeriod[];
}

// Placeholder for when @google/generative-ai is installed
import { GoogleGenerativeAI } from '@google/generative-ai';
let genAI: any = null;

try {
  genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
} catch (e) {
  console.log('Google Generative AI package not installed or failed to initialize.');
}

const SCENARIO_TEMPLATES: Record<string, string> = {
  hurricane: `Generate a realistic emergency response scenario for a hurricane in {location} affecting {population} residents with {severity} severity. 
Create exactly 13 operational periods from T-72h (72 hours before landfall) to T+84h (84 hours after landfall).
Follow this progression: 3 planning periods (T-72h to T-36h), 2 preparation periods (T-36h to T-12h), 2 response periods (T-0h to T+24h), and 6 recovery periods (T+24h to T+84h).
Phases must be: planning → preparation → response → recovery.

For each period, provide 2-3 realistic weather/infrastructure injects and 2-4 corresponding EOC actions.
Use realistic scenario escalation that matches the hurricane category progression.

Include varied inject types: weather_update, public_behavior, infrastructure, forecast_change, public_announcement, evacuation_order, shelter, closure, resource_distribution, emergency_response.
Injects severity: low (routine), medium (notable), high (serious), critical (immediate danger).
EOC actions should show realistic decision-making under escalating threat.`,

  epidemic: `Generate a realistic emergency response scenario for an epidemic in {location} affecting {population} residents with {severity} outbreak level.
Create exactly 13 operational periods showing disease progression and response evolution.
Phases: planning (detection/preparation) → preparation (containment setup) → response (active outbreak) → recovery (post-outbreak management).

Include injects about: case detection, transmission rates, hospital capacity, supply shortages, public behavior changes, contact tracing efforts.
EOC actions: quarantine orders, resource allocation, public health announcements, hospital surge planning, vaccination campaigns.`,

//   wildfire: `Generate a realistic emergency response scenario for a wildfire in {location} with {severity} intensity affecting {population} residents.
// Create exactly 13 operational periods from pre-fire warning through recovery.
// Show progression: initial detection → growing threat → peak fire → containment → recovery.
// Phases: planning → preparation → response → recovery.

// Include fire behavior updates, evacuation progression, air quality impacts, resource needs, and recovery challenges.`,

  flood: `Generate a realistic emergency response scenario for flooding in {location} with {severity} flooding affecting {population} residents.
Create exactly 13 operational periods from early warning through recovery.
Phases: planning (warning issued) → preparation (rising water) → response (peak flooding) → recovery (aftermath).

Include water level updates, evacuation orders, shelter operations, dam status updates, rescue operations, and reconstruction needs.`,

//   earthquake: `Generate a realistic emergency response scenario for an earthquake in {location} with {severity} magnitude affecting {population} residents.
// Create exactly 13 operational periods from initial event through recovery.
// Phases: planning (pre-event preparedness) → preparation (immediate aftermath) → response (rescue/stabilization) → recovery (reconstruction).

// Include aftershock reports, structural damage assessments, utility failures, casualty counts, and long-term rebuilding.`
};

export async function generateScenarioWithGemini(request: ScenarioRequest): Promise<ActionPlan> {
  // If Google API is available, use it; otherwise fall back to template-based generation
    
  return generateWithTemplate(request);

  if (process.env.GOOGLE_API_KEY && genAI) {
    // return generateWithGeminiAPI(request);
  } else {
    // If Gemini API is not available, use template-based fallback
  }
}

async function generateWithGeminiAPI(request: ScenarioRequest): Promise<ActionPlan> {
  if (!genAI) {
    throw new Error('Gemini API not initialized');
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
  const model = genAI.getGenerativeModel({ model: modelName });

  const template = SCENARIO_TEMPLATES[request.scenarioType] || SCENARIO_TEMPLATES.hurricane;
  const prompt = template
    .replace('{location}', request.location)
    .replace('{population}', request.population.toLocaleString())
    .replace('{severity}', request.severity);

  const systemPrompt = `You are an expert emergency management planner creating realistic TTX (Tabletop Exercise) scenarios.
Return ONLY valid JSON in the following strict format (no extra fields, no comments):

{
  "scenarioId": "<uuid>",
  "scenarioType": "<string>",
  "location": "<string>",
  "totalOperationalPeriods": 13,
  "actionPlan": {
    "periods": [
      {
        "periodNumber": <number>,
        "phase": "planning|preparation|response|recovery",
        "injects": [
          {
            "time": "<string>",
            "severity": "low|medium|high|critical",
            "type": "<string>",
            "title": "<string>",
            "description": "<string>"
          }
        ],
        "eocActions": [
          {
            "time": "<string>",
            "actionType": "<string>",
            "details": "<string>",
            "targetPopulation": "<string>",
            "urgency": "voluntary|mandatory",
            "zone": "<string>"
          }
        ]
      }
    ]
  }
}

All periods must be present, and all arrays must have at least 3 injects and 1 eocAction per period. Do not include any extra fields. Do not include comments. Do not wrap the JSON in markdown. Only output the JSON object.`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      }
    });

    const response = result.response.text();
    let jsonText = response?.trim() || '';

    // Try to extract fenced code block first
    const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch && fenceMatch[1]) {
      jsonText = fenceMatch[1].trim();
    } else {
      // Fallback: slice from first '{' to last '}'
      const first = jsonText.indexOf('{');
      const last = jsonText.lastIndexOf('}');
      if (first !== -1 && last !== -1 && last > first) {
        jsonText = jsonText.slice(first, last + 1).trim();
      }
    }

    if (!jsonText) {
      console.error('Gemini returned empty or unparsable response:', response);
      throw new Error('Gemini returned empty or unparsable response');
    }

    const generatedData = JSON.parse(jsonText);
    return normalizeActionPlan(generatedData);
  } catch (error) {
    console.error('Error generating scenario with Gemini:', error);
    throw error;
  }
}

export async function generateWithTemplate(request: ScenarioRequest): Promise<ActionPlan> {
  // Template-based generation for when Gemini API is not available
  // This uses realistic scenario structures based on emergency management best practices
  
  // Each period = 12 hours, number of periods = time * 2
  const numPeriods = Math.max(1, (request.time ?? 3) * 2);
  const baseTimeOffset = -12 * numPeriods / 2; // Center around T0
  const periods: OperationalPeriod[] = [];

  // Dynamic phase progression: first 1/4 planning, next 1/4 preparation, next 1/4 response, last 1/4 recovery
  const phaseProgression: Array<'planning' | 'preparation' | 'response' | 'recovery'> = Array.from({ length: numPeriods }, (_, i) => {
    const frac = i / numPeriods;
    if (frac < 0.25) return 'planning';
    if (frac < 0.5) return 'preparation';
    if (frac < 0.75) return 'response';
    return 'recovery';
  });

  const injectTypesByScenario = {
    hurricane: ['weather_update', 'public_behavior', 'infrastructure', 'forecast_change'],
    epidemic: ['case_report', 'hospital_status', 'public_behavior', 'resource_shortage'],
    wildfire: ['fire_behavior', 'evacuation_status', 'air_quality', 'resource_deployment'],
    flood: ['water_level', 'evacuation_order', 'infrastructure', 'rescue_operation'],
    earthquake: ['aftershock', 'damage_assessment', 'utility_failure', 'casualty_report']
  };

  const actionTypes = [
    'public_announcement',
    'evacuation_order',
    'shelter',
    'resource_distribution',
    'closure',
    'emergency_response',
    'resource_allocation',
    'public_health_order'
  ];

  const zones = ['Zone A', 'Zone B', 'Zone C', 'Zone D'];

  for (let i = 0; i < numPeriods; i++) {
    const startHour = baseTimeOffset + (i * 12);
    const endHour = startHour + 12;
    const phase = phaseProgression[i];

    // Generate realistic injects
    const numInjects = 2 + Math.floor(Math.random() * 2); // 2-3 injects
    const injects: Inject[] = [];
    
    for (let j = 0; j < numInjects; j++) {
      const injectType = injectTypesByScenario[request.scenarioType][j % injectTypesByScenario[request.scenarioType].length];
      const severity = calculateSeverity(i, phase, request.severity);
      
      injects.push({
        id: `inject-${i + 1}-${j + 1}`,
        time: `T${startHour + (j * 4)}h`,
        type: injectType,
        title: generateInjectTitle(request.scenarioType, phase, injectType, i),
        description: generateInjectDescription(request.scenarioType, phase, i, request.location, request.population),
        severity
      });
    }

    // Generate corresponding EOC actions
    const numActions = 2 + Math.floor(Math.random() * 3); // 2-4 actions
    const eocActions: EOCAction[] = [];

    for (let j = 0; j < numActions; j++) {
      const actionType = actionTypes[j % actionTypes.length];
      const urgency = phase === 'response' || phase === 'preparation' ? 'mandatory' : 'voluntary';
      const zone = phase === 'preparation' || phase === 'response' ? zones[j % zones.length] : undefined;

      eocActions.push({
        id: `action-${i + 1}-${j + 1}`,
        time: `T${startHour + (j * 2)}h`,
        actionType,
        details: generateActionDetails(actionType, request.scenarioType, phase, i, request.location),
        targetPopulation: generateTargetPopulation(phase, i, request.population, zone),
        ...(zone && { zone }),
        ...(actionType === 'evacuation_order' && { urgency })
      });
    }

    periods.push({
      periodNumber: i + 1,
      startTime: `T${startHour}h`,
      endTime: `T${endHour}h`,
      phase,
      injects,
      eocActions
    });
  }

  return { periods };
}

function normalizeActionPlan(data: any): ActionPlan {
  // Accept either strict format (actionPlan.periods) or fallback (periods)
  let periodsInput: any[] | undefined = undefined;
  if (data && Array.isArray(data.periods)) {
    periodsInput = data.periods;
  } else if (data && data.actionPlan && Array.isArray(data.actionPlan.periods)) {
    periodsInput = data.actionPlan.periods;
  }
  if (!periodsInput) {
    throw new Error('Gemini response missing periods array');
  }
  if (periodsInput.length !== 13) {
    throw new Error(`Expected 13 periods, got ${periodsInput.length}`);
  }
  periodsInput.forEach((period: any, idx: number) => {
    const requiredFields = ['periodNumber', 'phase', 'injects', 'eocActions'];
    requiredFields.forEach(field => {
      if (!(field in period)) {
        throw new Error(`Period ${idx + 1} missing required field: ${field}`);
      }
    });
    if (!Array.isArray(period.injects) || period.injects.length < 3) {
      throw new Error(`Period ${idx + 1} injects must be an array with at least 3 items`);
    }
    if (!Array.isArray(period.eocActions) || period.eocActions.length < 1) {
      throw new Error(`Period ${idx + 1} eocActions must be an array with at least 1 item`);
    }
  });
  // Normalize into ActionPlan shape
  const normalizedPeriods: OperationalPeriod[] = periodsInput.map((period: any, index: number) => ({
    periodNumber: period.periodNumber || index + 1,
    startTime: period.startTime || `T${-72 + (index * 12)}h`,
    endTime: period.endTime || `T${-72 + ((index + 1) * 12)}h`,
    phase: validatePhase(period.phase),
    injects: (period.injects || []).map((inject: any, idx: number) => ({
      id: inject.id || `inject-${index + 1}-${idx + 1}`,
      time: inject.time || (period.startTime || `T${-72 + (index * 12)}h`),
      type: inject.type || 'weather_update',
      title: inject.title || 'Event',
      description: inject.description || 'Event occurring',
      severity: validateSeverity(inject.severity)
    })),
    eocActions: (period.eocActions || []).map((action: any, idx: number) => ({
      id: action.id || `action-${index + 1}-${idx + 1}`,
      time: action.time || (period.startTime || `T${-72 + (index * 12)}h`),
      actionType: action.actionType || 'public_announcement',
      details: action.details || 'Action being taken',
      targetPopulation: action.targetPopulation || 'All residents',
      urgency: action.urgency as 'voluntary' | 'mandatory' | undefined,
      zone: action.zone
    }))
  }));

  return { periods: normalizedPeriods };
}

function validatePhase(phase: string): 'planning' | 'preparation' | 'response' | 'recovery' {
  const validPhases = ['planning', 'preparation', 'response', 'recovery'];
  if (validPhases.includes(phase?.toLowerCase())) {
    return phase.toLowerCase() as 'planning' | 'preparation' | 'response' | 'recovery';
  }
  return 'planning';
}

function validateSeverity(severity: string): 'low' | 'medium' | 'high' | 'critical' {
  const validSeverities = ['low', 'medium', 'high', 'critical'];
  if (validSeverities.includes(severity?.toLowerCase())) {
    return severity.toLowerCase() as 'low' | 'medium' | 'high' | 'critical';
  }
  return 'medium';
}

function calculateSeverity(periodIndex: number, phase: string, userSeverity: string): 'low' | 'medium' | 'high' | 'critical' {
  // Escalate severity based on phase progression
  if (phase === 'planning') return 'low';
  if (phase === 'preparation') return periodIndex > 4 ? 'high' : 'medium';
  if (phase === 'response') return 'critical';
  return 'high'; // recovery
}

function generateInjectTitle(scenario: string, phase: string, type: string, periodIndex: number): string {
  const titles: Record<string, Record<string, string[]>> = {
    hurricane: {
      planning: [
        'Tropical Storm Watch Issued',
        'Storm Strengthens to Category 2',
        'Initial Public Awareness Campaign'
      ],
      preparation: [
        'Category 3 Hurricane Warning',
        'Resources Stockpiling Begins',
        'Evacuation Zones Established'
      ],
      response: [
        'Hurricane Making Landfall',
        'Widespread Power Outages',
        'Severe Damage Reports'
      ],
      recovery: [
        'Storm Clears - Assessment Begins',
        'Restoration Operations Start',
        'Long-term Recovery Planning'
      ]
    },
    epidemic: {
      planning: [
        'First Cases Detected',
        'Health Alert Issued',
        'Public Notification Begins'
      ],
      preparation: [
        'Case Count Rising',
        'Hospital Capacity Concerns',
        'Testing Centers Open'
      ],
      response: [
        'Peak Outbreak Period',
        'Healthcare System Overwhelmed',
        'Quarantine Orders Issued'
      ],
      recovery: [
        'Case Decline Observed',
        'Vaccination Campaign Ongoing',
        'Return to Normal Efforts'
      ]
    }
  };

  const scenarioTitles = titles[scenario] || titles.hurricane;
  const phaseTitles = scenarioTitles[phase] || scenarioTitles.planning;
  return phaseTitles[periodIndex % phaseTitles.length];
}

function generateInjectDescription(scenario: string, phase: string, periodIndex: number, location: string, population: number): string {
  const populationPercent = Math.floor((periodIndex + 1) / 13 * 100);
  const descriptions: Record<string, Record<string, string>> = {
    hurricane: {
      planning: `Initial weather warnings for ${location}. Expected to affect ${population.toLocaleString()} residents.`,
      preparation: `Storm intensifying. Preparations ongoing in ${location}. Evacuations may be necessary.`,
      response: `Emergency conditions in ${location}. Severe impacts affecting communities across the area.`,
      recovery: `Assessment of damage in ${location}. Recovery efforts mobilized. Approximately ${populationPercent}% of residents affected.`
    },
    epidemic: {
      planning: `First cases confirmed in ${location}. Health department investigating transmission patterns.`,
      preparation: `Confirmed cases spreading in ${location}. Healthcare facilities preparing surge capacity.`,
      response: `Outbreak peak in ${location}. Hospitals at capacity. Quarantine measures in effect for ${Math.floor(population * 0.1).toLocaleString()} people.`,
      recovery: `Cases declining in ${location}. Vaccination program ongoing. ${populationPercent}% of target population vaccinated.`
    }
  };

  const scenarioDescs = descriptions[scenario] || descriptions.hurricane;
  return scenarioDescs[phase];
}

function generateActionDetails(actionType: string, scenario: string, phase: string, periodIndex: number, location: string): string {
  const details: Record<string, string> = {
    public_announcement: `Issue public announcement regarding current status and recommended actions in ${location}.`,
    evacuation_order: `Evacuation order issued for designated zones in ${location}. All residents must comply.`,
    shelter: `Open emergency shelters across ${location}. All facilities staffed and equipped.`,
    resource_distribution: `Distribute emergency supplies and resources to affected residents in ${location}.`,
    closure: `Non-essential facilities closed. Essential services maintain limited operations.`,
    emergency_response: `Emergency response teams deployed. Search and rescue operations underway.`,
    resource_allocation: `Allocate resources to critical infrastructure and healthcare facilities.`,
    public_health_order: `Public health order issued. Quarantine and isolation protocols in effect.`
  };

  return details[actionType] || 'Emergency operations activity initiated.';
}

function generateTargetPopulation(phase: string, periodIndex: number, population: number, zone?: string): string {
  const zoneText = zone ? ` in ${zone}` : '';
  const affected = Math.floor(population * (0.1 + (periodIndex / 13) * 0.8));

  if (phase === 'planning') return `All residents${zoneText}`;
  if (phase === 'preparation') return `Residents in evacuation areas${zoneText} (approximately ${affected.toLocaleString()})`;
  if (phase === 'response') return `All residents in impact zone${zoneText} (approximately ${Math.floor(population * 0.7).toLocaleString()})`;
  return `Residents in affected areas${zoneText} (approximately ${affected.toLocaleString()})`;
}
