import type { PersonaDemographics } from '@/lib/types/ttx';

// Generate realistic demographics based on persona type
export function generatePersonaDemographics(
  personaType: string,
  personaIndex: number
): PersonaDemographics {
  // Deterministic randomness based on persona ID
  const seed = personaType.length + personaIndex;

  const demographicProfiles: Record<string, Partial<PersonaDemographics>> = {
    'The Planner': {
      age: 35 + (seed % 25),
      socialStatus: 'middle_income',
      politicalLeaning: 'moderate',
      trustInGovernment: 'high',
      educationLevel: 'bachelors',
      hasVehicle: true,
      homeOwnership: 'own'
    },
    'The Skeptic': {
      age: 40 + (seed % 30),
      socialStatus: seed % 2 === 0 ? 'middle_income' : 'high_income',
      politicalLeaning: seed % 3 === 0 ? 'liberal' : 'conservative',
      trustInGovernment: 'low',
      educationLevel: seed % 2 === 0 ? 'some_college' : 'bachelors',
      hasVehicle: true,
      homeOwnership: 'own'
    },
    'The Altruist': {
      age: 45 + (seed % 20),
      socialStatus: 'middle_income',
      politicalLeaning: 'liberal',
      trustInGovernment: 'medium',
      educationLevel: 'bachelors',
      hasVehicle: true,
      homeOwnership: seed % 2 === 0 ? 'own' : 'rent'
    },
    'Resource Constrained': {
      age: 28 + (seed % 35),
      socialStatus: 'low_income',
      politicalLeaning: seed % 2 === 0 ? 'liberal' : 'moderate',
      trustInGovernment: 'medium',
      educationLevel: seed % 2 === 0 ? 'high_school' : 'some_college',
      hasVehicle: seed % 3 !== 0,  // 66% have vehicle
      homeOwnership: 'rent'
    },
    'The Elderly': {
      age: 65 + (seed % 20),
      socialStatus: seed % 2 === 0 ? 'middle_income' : 'low_income',
      politicalLeaning: seed % 2 === 0 ? 'conservative' : 'moderate',
      trustInGovernment: 'high',
      educationLevel: seed % 2 === 0 ? 'high_school' : 'some_college',
      hasVehicle: seed % 2 === 0,
      homeOwnership: 'own'
    },
    'Family First': {
      age: 32 + (seed % 15),
      socialStatus: 'middle_income',
      politicalLeaning: 'moderate',
      trustInGovernment: 'medium',
      educationLevel: seed % 2 === 0 ? 'some_college' : 'bachelors',
      hasVehicle: true,
      homeOwnership: seed % 2 === 0 ? 'own' : 'rent',
      hasChildren: true,
      householdSize: 3 + (seed % 3)
    },
    'Information Seeker': {
      age: 30 + (seed % 25),
      socialStatus: seed % 2 === 0 ? 'middle_income' : 'high_income',
      politicalLeaning: 'moderate',
      trustInGovernment: 'medium',
      educationLevel: seed % 2 === 0 ? 'bachelors' : 'graduate',
      hasVehicle: true,
      homeOwnership: 'own'
    },
    'Community Leader': {
      age: 45 + (seed % 20),
      socialStatus: 'middle_income',
      politicalLeaning: seed % 3 === 0 ? 'liberal' : seed % 3 === 1 ? 'moderate' : 'conservative',
      trustInGovernment: 'high',
      educationLevel: 'bachelors',
      hasVehicle: true,
      homeOwnership: 'own'
    },
    'Tech Savvy': {
      age: 25 + (seed % 20),
      socialStatus: seed % 2 === 0 ? 'middle_income' : 'high_income',
      politicalLeaning: 'liberal',
      trustInGovernment: 'medium',
      educationLevel: 'bachelors',
      hasVehicle: true,
      homeOwnership: seed % 2 === 0 ? 'rent' : 'own'
    },
    'The Traditional': {
      age: 55 + (seed % 20),
      socialStatus: 'middle_income',
      politicalLeaning: 'conservative',
      trustInGovernment: 'high',
      educationLevel: 'high_school',
      hasVehicle: true,
      homeOwnership: 'own'
    },
    'The Optimist': {
      age: 35 + (seed % 30),
      socialStatus: seed % 3 === 0 ? 'low_income' : 'middle_income',
      politicalLeaning: 'moderate',
      trustInGovernment: 'medium',
      educationLevel: 'some_college',
      hasVehicle: seed % 3 !== 0,
      homeOwnership: seed % 2 === 0 ? 'rent' : 'own'
    },
    'The Anxious': {
      age: 28 + (seed % 25),
      socialStatus: 'middle_income',
      politicalLeaning: seed % 2 === 0 ? 'liberal' : 'moderate',
      trustInGovernment: 'low',
      educationLevel: seed % 2 === 0 ? 'some_college' : 'bachelors',
      hasVehicle: true,
      homeOwnership: 'rent'
    }
  };

  const profile = demographicProfiles[personaType] || {};

  // Diverse race distribution (Miami-Dade demographics)
  const raceDistribution: PersonaDemographics['race'][] = [
    'hispanic', 'hispanic', 'hispanic', 'hispanic', // 40%
    'white', 'white', 'white', // 30%
    'black', 'black', // 20%
    'asian', // 10%
  ];
  const race = raceDistribution[seed % raceDistribution.length];

  return {
    age: profile.age ?? 35,
    race,
    socialStatus: profile.socialStatus ?? 'middle_income',
    politicalLeaning: profile.politicalLeaning ?? 'moderate',
    trustInGovernment: profile.trustInGovernment ?? 'medium',
    educationLevel: profile.educationLevel ?? 'some_college',
    householdSize: profile.householdSize ?? (1 + (seed % 3)),
    hasChildren: profile.hasChildren ?? (seed % 3 === 0),
    hasVehicle: profile.hasVehicle ?? true,
    homeOwnership: profile.homeOwnership ?? (seed % 2 === 0 ? 'own' : 'rent')
  };
}

// Helper to get demographic label
export function getDemographicLabel(key: string, value: any): string {
  const labels: Record<string, Record<string, string>> = {
    race: {
      white: 'White',
      black: 'Black',
      hispanic: 'Hispanic',
      asian: 'Asian',
      other: 'Other'
    },
    socialStatus: {
      low_income: 'Low Income',
      middle_income: 'Middle Income',
      high_income: 'High Income'
    },
    politicalLeaning: {
      liberal: 'Liberal',
      moderate: 'Moderate',
      conservative: 'Conservative'
    },
    trustInGovernment: {
      low: 'Low Trust',
      medium: 'Medium Trust',
      high: 'High Trust'
    },
    educationLevel: {
      high_school: 'High School',
      some_college: 'Some College',
      bachelors: "Bachelor's",
      graduate: 'Graduate Degree'
    },
    homeOwnership: {
      rent: 'Renter',
      own: 'Homeowner'
    }
  };

  return labels[key]?.[value] || String(value);
}
