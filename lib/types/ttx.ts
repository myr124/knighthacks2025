// TTX (Tabletop Exercise) Simulation - 12-Hour Operational Periods

export interface TTXScript {
  id: string;
  name: string;
  description: string;
  scenarioType: 'hurricane' | 'wildfire' | 'flood' | 'earthquake';
  location: string;
  startTime: string; // "T-120h" (5 days before)
  endTime: string; // "T+24h" (1 day after)
  totalOperationalPeriods: number;
}

export interface PersonaType {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface OperationalPeriod {
  id: string;
  periodNumber: number; // 1-12
  startTime: string; // "T-120h"
  endTime: string; // "T-108h"
  label: string; // "Day 5 AM (T-120h to T-108h)"
  phase: 'planning' | 'preparation' | 'response' | 'recovery';
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

export interface PersonaDemographics {
  age: number;
  race: 'white' | 'black' | 'hispanic' | 'asian' | 'other';
  socialStatus: 'low_income' | 'middle_income' | 'high_income';
  politicalLeaning: 'liberal' | 'moderate' | 'conservative';
  trustInGovernment: 'low' | 'medium' | 'high';
  educationLevel: 'high_school' | 'some_college' | 'bachelors' | 'graduate';
  householdSize: number;
  hasChildren: boolean;
  hasVehicle: boolean;
  homeOwnership: 'rent' | 'own';
}

export interface PersonaResponse {
  personaId: string;
  personaType: string;
  personaName: string;
  demographics: PersonaDemographics;
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

export interface PersonaMapData {
  personaId: string;
  homeLocation: { lat: number; lng: number };
  shelterLocation: { lat: number; lng: number };
  evacuationStartPeriod: number | null; // Which period they started evacuating
  evacuationEndPeriod: number | null; // Which period they reached shelter
}

export interface PeriodResult {
  periodNumber: number;
  operationalPeriod: OperationalPeriod;
  injects: Inject[];
  eocActions: EOCAction[];
  personaResponses: PersonaResponse[]; // All 50 personas
  aggregates: {
    totalPersonas: number;
    decisions: Record<PersonaResponse['decision'], number>;
    sentiments: Record<PersonaResponse['sentiment'], number>;
    locations: Record<PersonaResponse['location'], number>;
    needingAssistance: number;
    criticalIssues: string[]; // AI-identified problems
  };
}

export interface ScenarioResults {
  id: string;
  ttxScript: TTXScript;
  periodResults: PeriodResult[]; // All operational periods
  createdAt: Date;
  status: 'idle' | 'generating' | 'completed' | 'error';
  generationTime?: number; // seconds
  error?: string;
}

export interface ActionPlan {
  scenarioId: string;
  periods: {
    periodNumber: number;
    injects: Inject[];
    actions: EOCAction[];
  }[];
}
