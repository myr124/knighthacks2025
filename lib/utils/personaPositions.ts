// Helper functions for generating persona positions across operational periods

export interface PersonaLocationData {
  homeLocation: { lat: number; lng: number };
  shelterLocation: { lat: number; lng: number };
  evacuationStartPeriod: number | null;
  evacuationEndPeriod: number | null;
}

// Miami-Dade area bounds
const MIAMI_CENTER = { lat: 25.7617, lng: -80.1918 };
const HOME_SPREAD = 0.25; // degrees (~17 miles)
const SHELTER_LOCATIONS = [
  { lat: 25.8, lng: -80.25, name: 'North Shelter' },
  { lat: 25.72, lng: -80.3, name: 'West Shelter' },
  { lat: 25.65, lng: -80.15, name: 'South Shelter' }
];

// Evacuation timing by persona type (which period they start evacuating)
const EVACUATION_START_PERIODS: Record<string, number> = {
  'The Planner': 4,        // Evacuates early (T-85h)
  'The Skeptic': 10,       // Waits until last minute (T-10h)
  'The Altruist': 6,       // Delayed helping others
  'Resource Constrained': 7, // Waits for public transport
  'The Elderly': 6,        // Needs time to prepare
  'Family First': 5,       // Evacuates early for kids
  'Information Seeker': 6, // Waits for more data
  'Community Leader': 5,   // Leads by example
  'Tech Savvy': 6,         // Monitors apps
  'The Traditional': 7,    // Waits for TV news confirmation
  'The Optimist': 9,       // Underestimates, evacuates late
  'The Anxious': 5        // Evacuates early from fear
};

// How long evacuation takes (number of periods to reach shelter)
const EVACUATION_DURATION = 2; // 24 hours travel time

export function generatePersonaLocation(
  personaType: string,
  personaIndex: number,
  totalPersonas: number
): PersonaLocationData {
  // Generate home location (spread across Miami-Dade)
  const angle = (personaIndex / totalPersonas) * Math.PI * 2;
  const distance = Math.random() * HOME_SPREAD;

  const homeLocation = {
    lat: MIAMI_CENTER.lat + Math.cos(angle) * distance,
    lng: MIAMI_CENTER.lng + Math.sin(angle) * distance
  };

  // Assign to nearest shelter
  const shelterIndex = personaIndex % SHELTER_LOCATIONS.length;
  const shelterLocation = {
    lat: SHELTER_LOCATIONS[shelterIndex].lat,
    lng: SHELTER_LOCATIONS[shelterIndex].lng
  };

  // Determine evacuation timing
  const baseStartPeriod = EVACUATION_START_PERIODS[personaType] || 7;
  const evacuationStartPeriod = baseStartPeriod + Math.floor(Math.random() * 2 - 1); // +/- 1 period variation
  const evacuationEndPeriod = Math.min(evacuationStartPeriod + EVACUATION_DURATION, 12);

  return {
    homeLocation,
    shelterLocation,
    evacuationStartPeriod: Math.max(1, evacuationStartPeriod),
    evacuationEndPeriod
  };
}

export function calculatePersonaPosition(
  locationData: PersonaLocationData,
  periodNumber: number
): { lat: number; lng: number } {
  const { homeLocation, shelterLocation, evacuationStartPeriod, evacuationEndPeriod } = locationData;

  // Not evacuating yet - at home
  if (!evacuationStartPeriod || periodNumber < evacuationStartPeriod) {
    return homeLocation;
  }

  // Already at shelter
  if (!evacuationEndPeriod || periodNumber >= evacuationEndPeriod) {
    return shelterLocation;
  }

  // Currently evacuating - interpolate position
  const progress = (periodNumber - evacuationStartPeriod) / (evacuationEndPeriod - evacuationStartPeriod);
  const smoothProgress = easeInOutCubic(progress); // Smooth acceleration/deceleration

  return {
    lat: homeLocation.lat + (shelterLocation.lat - homeLocation.lat) * smoothProgress,
    lng: homeLocation.lng + (shelterLocation.lng - homeLocation.lng) * smoothProgress
  };
}

// Smooth easing function for realistic movement
function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function getPersonaLocationStatus(
  locationData: PersonaLocationData,
  periodNumber: number
): 'home' | 'evacuating' | 'shelter' {
  const { evacuationStartPeriod, evacuationEndPeriod } = locationData;

  if (!evacuationStartPeriod || periodNumber < evacuationStartPeriod) {
    return 'home';
  }

  if (!evacuationEndPeriod || periodNumber >= evacuationEndPeriod) {
    return 'shelter';
  }

  return 'evacuating';
}
