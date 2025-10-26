export interface ScenarioConfig {
  scenarioType: 'hurricane' | 'epidemic' | 'wildfire' | 'flood' | 'earthquake';
  location: string;
  severity: 'minor' | 'moderate' | 'major' | 'severe' | 'catastrophic';
  time: number;
  population: number;
  agents: number;
}

export interface Inject {
  id: string;
  time: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  title: string;
  description: string;
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
  id: string;
  periodNumber: number;
  label: string;
  phase: 'planning' | 'preparation' | 'response' | 'recovery';
  injects: Inject[];
  eocActions: EOCAction[];
}

export interface TTXScript {
  scenarioType: string;
  location: string;
  severity: string;
  time?: number;
  population: number;
  periods: (OperationalPeriod & {
    injects: Inject[];
    eocActions: EOCAction[];
  })[];
}

export function generateTTX(config: ScenarioConfig): TTXScript {
  // Mock generation based on config
  const severityMap: Record<ScenarioConfig['severity'], { injectSeverity: 'low' | 'medium' | 'high' | 'critical', numInjects: number }> = {
    minor: { injectSeverity: 'low', numInjects: 2 },
    moderate: { injectSeverity: 'medium', numInjects: 3 },
    major: { injectSeverity: 'high', numInjects: 4 },
    severe: { injectSeverity: 'high', numInjects: 5 },
    catastrophic: { injectSeverity: 'critical', numInjects: 6 },
  };

  const sev = severityMap[config.severity];

  const periods: TTXScript['periods'] = [
    {
      id: 'op-1',
      periodNumber: 1,
      label: 't-0 - t-12',
      phase: 'planning' as const,
      injects: Array.from({ length: sev.numInjects }, (_, i) => ({
        id: `inj-${i + 1}`,
        time: `00:${String(i * 15).padStart(2, '0')}`,
        severity: sev.injectSeverity,
        type: 'weather_update',
        title: `${config.scenarioType.charAt(0).toUpperCase() + config.scenarioType.slice(1)} Alert ${i + 1}`,
        description: `Initial ${config.scenarioType} warnings for ${config.location}. Expected impact on ${config.population.toLocaleString()} residents.`,
      })),
      eocActions: [
        {
          id: 'act-1',
          time: '00:00',
          actionType: 'planning_meeting',
          details: 'Convene EOC planning team.',
          targetPopulation: `${config.population.toLocaleString()} affected`,
        },
      ],
    },
    {
      id: 'op-2',
      periodNumber: 2,
      label: 't-12 - t-24',
      phase: 'response' as const,
      injects: Array.from({ length: sev.numInjects }, (_, i) => ({
        id: `inj-${sev.numInjects + i + 1}`,
        time: `01:${String(i * 20).padStart(2, '0')}`,
        severity: sev.injectSeverity,
        type: 'emergency_alert',
        title: `${config.severity.charAt(0).toUpperCase() + config.severity.slice(1)} ${config.scenarioType.charAt(0).toUpperCase() + config.scenarioType.slice(1)} Impact`,
        description: `Major impacts reported in ${config.location}. Evacuation considerations for high-risk areas.`,
      })),
      eocActions: [
        {
          id: 'act-2',
          time: '01:00',
          actionType: 'evacuation_order',
          details: 'Issue evacuation orders for coastal zones.',
          targetPopulation: '500,000',
          urgency: 'mandatory' as const,
          zone: 'Zone A',
        },
      ],
    },
    {
      id: 'op-3',
      periodNumber: 3,
      label: 't-24 - t-36',
      phase: 'recovery' as const,
      injects: Array.from({ length: 2 }, (_, i) => ({
        id: `inj-final-${i + 1}`,
        time: `02:${String(i * 30).padStart(2, '0')}`,
        severity: 'low',
        type: 'recovery_update',
        title: 'Recovery Assessment',
        description: `Damage assessment complete for ${config.location}. ${config.population.toLocaleString()} residents to be supported in recovery efforts.`,
      })),
      eocActions: [
        {
          id: 'act-3',
          time: '02:00',
          actionType: 'resource_allocation',
          details: 'Allocate recovery resources and support services.',
          targetPopulation: `${config.population.toLocaleString()}`,
        },
      ],
    },
  ];

  return {
    scenarioType: config.scenarioType,
    location: config.location,
    severity: config.severity,
    time: config.time,
    population: config.population,
    periods,
  };
}
