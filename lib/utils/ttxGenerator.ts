import type { OperationalPeriod, Inject, EOCAction } from '@/lib/types/ttx';

export interface ScenarioConfig {
  scenarioType: 'hurricane' | 'wildfire' | 'flood' | 'earthquake';
  location: string;
  severity: 'minor' | 'moderate' | 'major' | 'catastrophic';
  population: number;
}

// Generate 12 operational periods
export function generateOperationalPeriods(): OperationalPeriod[] {
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

// Hurricane-specific injects
function generateHurricaneInjects(config: ScenarioConfig): Record<number, Inject[]> {
  const severity = config.severity;
  const location = config.location;

  return {
    1: [
      {
        id: 'inject-1-1',
        periodNumber: 1,
        time: 'T-115h',
        type: 'weather_update',
        title: 'NWS Issues Tropical Storm Watch',
        description: `National Weather Service issues tropical storm watch for ${location}. System currently at 50 mph winds, expected to strengthen.`,
        severity: 'medium'
      }
    ],
    2: [
      {
        id: 'inject-2-1',
        periodNumber: 2,
        time: 'T-105h',
        type: 'weather_update',
        title: 'Tropical Storm Strengthens',
        description: `Storm now at 65 mph winds. Forecast track shows potential landfall near ${location} in 4-5 days.`,
        severity: 'medium'
      },
      {
        id: 'inject-2-2',
        periodNumber: 2,
        time: 'T-100h',
        type: 'media',
        title: 'Local Media Coverage Begins',
        description: 'Local news stations begin continuous coverage. Public awareness increasing.',
        severity: 'low'
      }
    ],
    3: [
      {
        id: 'inject-3-1',
        periodNumber: 3,
        time: 'T-90h',
        type: 'weather_update',
        title: 'Upgraded to Hurricane Category 1',
        description: `System upgraded to Category 1 hurricane with 80 mph winds. Forecast confidence for ${location} impact increasing.`,
        severity: 'high'
      }
    ],
    4: [
      {
        id: 'inject-4-1',
        periodNumber: 4,
        time: 'T-85h',
        type: 'forecast_change',
        title: severity === 'catastrophic' ? 'Hurricane Upgraded to Category 4' : 'Hurricane Upgraded to Category 3',
        description: `NWS upgrades storm to Category ${severity === 'catastrophic' ? '4' : '3'} hurricane with ${severity === 'catastrophic' ? '145' : '125'} mph winds. Landfall expected in 72-84 hours.`,
        severity: 'high'
      },
      {
        id: 'inject-4-2',
        periodNumber: 4,
        time: 'T-80h',
        type: 'infrastructure',
        title: 'Gas Stations Report Increased Demand',
        description: 'Gas stations reporting 30% increase in fuel sales. Some stations experiencing temporary shortages.',
        severity: 'medium'
      }
    ],
    5: [
      {
        id: 'inject-5-1',
        periodNumber: 5,
        time: 'T-70h',
        type: 'public_behavior',
        title: 'Grocery Stores See Rush',
        description: 'Long lines at grocery stores. Water, batteries, and canned goods selling out quickly.',
        severity: 'medium'
      }
    ],
    6: [
      {
        id: 'inject-6-1',
        periodNumber: 6,
        time: 'T-60h',
        type: 'weather_update',
        title: 'Hurricane Forecast Solidifies',
        description: `Confidence in landfall location increases. Direct hit on ${location} now most likely scenario.`,
        severity: 'high'
      },
      {
        id: 'inject-6-2',
        periodNumber: 6,
        time: 'T-55h',
        type: 'infrastructure',
        title: 'Some Roads Begin to Congest',
        description: 'Traffic increasing on northbound evacuation routes. Travel times 30% longer than normal.',
        severity: 'medium'
      }
    ],
    7: [
      {
        id: 'inject-7-1',
        periodNumber: 7,
        time: 'T-45h',
        type: 'weather_update',
        title: severity === 'catastrophic' ? 'Hurricane Strengthens to Category 5' : 'Hurricane Maintains Intensity',
        description: severity === 'catastrophic'
          ? `Storm reaches Category 5 status with 160+ mph winds. Catastrophic damage expected.`
          : `Storm maintains ${severity === 'major' ? 'Category 4' : 'Category 3'} strength. Storm surge 10-15 feet predicted.`,
        severity: 'critical'
      }
    ],
    8: [
      {
        id: 'inject-8-1',
        periodNumber: 8,
        time: 'T-38h',
        type: 'weather_update',
        title: 'Hurricane Approaching',
        description: `Storm ${severity === 'catastrophic' ? 'Category 5' : severity === 'major' ? 'Category 4' : 'Category 3'} with maximum sustained winds. Storm surge forecast 12-18 feet for coastal areas.`,
        severity: 'critical'
      },
      {
        id: 'inject-8-2',
        periodNumber: 8,
        time: 'T-30h',
        type: 'public_behavior',
        title: 'Severe Traffic Congestion',
        description: 'Major highways experiencing heavy delays. Travel time to neighboring counties increased to 3+ hours.',
        severity: 'high'
      }
    ],
    9: [
      {
        id: 'inject-9-1',
        periodNumber: 9,
        time: 'T-20h',
        type: 'weather_update',
        title: 'Hurricane 24 Hours Out',
        description: 'Landfall expected in approximately 24 hours. Tropical storm force winds beginning to affect area.',
        severity: 'critical'
      },
      {
        id: 'inject-9-2',
        periodNumber: 9,
        time: 'T-15h',
        type: 'infrastructure',
        title: 'Power Outages Begin',
        description: 'First power outages reported. Utilities warning of extended outages possible.',
        severity: 'high'
      }
    ],
    10: [
      {
        id: 'inject-10-1',
        periodNumber: 10,
        time: 'T-10h',
        type: 'weather_update',
        title: 'Hurricane Imminent',
        description: 'Landfall in 10-12 hours. Conditions rapidly deteriorating. Hurricane force winds expected within hours.',
        severity: 'critical'
      },
      {
        id: 'inject-10-2',
        periodNumber: 10,
        time: 'T-8h',
        type: 'public_behavior',
        title: 'Last-Minute Evacuations',
        description: 'Reports of residents attempting last-minute evacuations. Emergency services may not be able to respond.',
        severity: 'high'
      }
    ],
    11: [
      {
        id: 'inject-11-1',
        periodNumber: 11,
        time: 'T+2h',
        type: 'weather_update',
        title: 'Hurricane Makes Landfall',
        description: 'Eye of hurricane crossing coast. Catastrophic winds and storm surge impacting area.',
        severity: 'critical'
      },
      {
        id: 'inject-11-2',
        periodNumber: 11,
        time: 'T+5h',
        type: 'infrastructure',
        title: 'Widespread Power Outages',
        description: `Over ${config.population > 1000000 ? '80%' : '70%'} of area without power. Major infrastructure damage reported.`,
        severity: 'critical'
      }
    ],
    12: [
      {
        id: 'inject-12-1',
        periodNumber: 12,
        time: 'T+15h',
        type: 'weather_update',
        title: 'Hurricane Moves Inland',
        description: 'Storm weakening as it moves inland. Conditions improving but flooding remains concern.',
        severity: 'high'
      },
      {
        id: 'inject-12-2',
        periodNumber: 12,
        time: 'T+20h',
        type: 'infrastructure',
        title: 'Damage Assessment Begins',
        description: 'Emergency services beginning damage assessment. Roads impassable in many areas.',
        severity: 'high'
      }
    ]
  };
}

// Hurricane-specific EOC actions
function generateHurricaneEOCActions(config: ScenarioConfig): Record<number, EOCAction[]> {
  const location = config.location;
  const severity = config.severity;

  return {
    1: [
      {
        id: 'action-1-1',
        periodNumber: 1,
        time: 'T-118h',
        actionType: 'public_announcement',
        details: 'EOC activates Level 1. Public advised to monitor weather and review emergency plans.',
        targetPopulation: 'All residents'
      }
    ],
    2: [
      {
        id: 'action-2-1',
        periodNumber: 2,
        time: 'T-110h',
        actionType: 'public_announcement',
        details: 'Issue initial public awareness campaign about potential hurricane threat. Encourage emergency kit preparation.',
        targetPopulation: 'All residents'
      }
    ],
    3: [
      {
        id: 'action-3-1',
        periodNumber: 3,
        time: 'T-95h',
        actionType: 'public_announcement',
        details: 'EOC upgrades to Level 2. Emergency shelters identified and being prepared.',
        targetPopulation: 'All residents'
      }
    ],
    4: [
      {
        id: 'action-4-1',
        periodNumber: 4,
        time: 'T-85h',
        actionType: 'evacuation_order',
        zone: 'Zone A',
        urgency: 'voluntary',
        details: 'Issue voluntary evacuation order for coastal Zone A (mobile homes, low-lying areas)',
        targetPopulation: 'Coastal residents, mobile homes'
      }
    ],
    5: [
      {
        id: 'action-5-1',
        periodNumber: 5,
        time: 'T-75h',
        actionType: 'public_announcement',
        details: 'Press conference: Update on storm track and evacuation timeline. Encourage early evacuation.',
        targetPopulation: 'All residents'
      }
    ],
    6: [
      {
        id: 'action-6-1',
        periodNumber: 6,
        time: 'T-60h',
        actionType: 'shelter',
        details: `Open primary emergency shelter at ${location} High School (capacity: ${config.population > 1000000 ? '1000' : '500'})`,
        targetPopulation: 'General public'
      },
      {
        id: 'action-6-2',
        periodNumber: 6,
        time: 'T-55h',
        actionType: 'evacuation_order',
        zone: 'Zone B',
        urgency: 'voluntary',
        details: 'Expand voluntary evacuation to Zone B (flood-prone areas)',
        targetPopulation: 'Flood-prone neighborhoods'
      }
    ],
    7: [
      {
        id: 'action-7-1',
        periodNumber: 7,
        time: 'T-48h',
        actionType: 'shelter',
        details: 'Open additional shelters across region. Special needs shelters activated.',
        targetPopulation: 'General public, special needs populations'
      },
      {
        id: 'action-7-2',
        periodNumber: 7,
        time: 'T-45h',
        actionType: 'evacuation_order',
        zone: 'Zone C',
        urgency: 'voluntary',
        details: 'Expand voluntary evacuation to Zone C',
        targetPopulation: 'Additional low-lying areas'
      }
    ],
    8: [
      {
        id: 'action-8-1',
        periodNumber: 8,
        time: 'T-38h',
        actionType: 'evacuation_order',
        zone: 'Zones A, B, and C',
        urgency: 'mandatory',
        details: `Mandatory evacuation order for Zones A, B, and C. All residents must evacuate immediately.`,
        targetPopulation: `Zones A, B, C - approximately ${Math.floor(config.population * 0.3)} residents`
      },
      {
        id: 'action-8-2',
        periodNumber: 8,
        time: 'T-36h',
        actionType: 'contraflow',
        details: 'Activate contraflow on major highways. All lanes outbound.',
        targetPopulation: 'Evacuating residents'
      },
      {
        id: 'action-8-3',
        periodNumber: 8,
        time: 'T-32h',
        actionType: 'shelter',
        details: 'Open secondary shelters: West Community Center, North High School',
        targetPopulation: 'General public'
      }
    ],
    9: [
      {
        id: 'action-9-1',
        periodNumber: 9,
        time: 'T-20h',
        actionType: 'public_announcement',
        details: 'Final call for evacuation. Emergency services will suspend operations when winds reach 45 mph.',
        targetPopulation: 'All residents in evacuation zones'
      }
    ],
    10: [
      {
        id: 'action-10-1',
        periodNumber: 10,
        time: 'T-10h',
        actionType: 'public_announcement',
        details: 'FINAL WARNING: Shelter in place if not yet evacuated. Do not travel. Emergency services suspended.',
        targetPopulation: 'All remaining residents'
      }
    ],
    11: [
      {
        id: 'action-11-1',
        periodNumber: 11,
        time: 'T+3h',
        actionType: 'public_announcement',
        details: 'Hurricane making landfall. Remain in secure location. Do not go outside.',
        targetPopulation: 'All residents'
      }
    ],
    12: [
      {
        id: 'action-12-1',
        periodNumber: 12,
        time: 'T+18h',
        actionType: 'public_announcement',
        details: 'Storm passing. Emergency services resuming. Damage assessment underway. Stay off roads.',
        targetPopulation: 'All residents'
      },
      {
        id: 'action-12-2',
        periodNumber: 12,
        time: 'T+22h',
        actionType: 'resource_deployment',
        details: 'Deploy search and rescue teams. Begin welfare checks in affected areas.',
        targetPopulation: 'Residents in severely impacted areas'
      }
    ]
  };
}

// Generate complete TTX script
export function generateTTXScript(config: ScenarioConfig) {
  const periods = generateOperationalPeriods();

  // Select appropriate generators based on scenario type
  const injectsMap = config.scenarioType === 'hurricane'
    ? generateHurricaneInjects(config)
    : generateHurricaneInjects(config); // Default to hurricane for now

  const actionsMap = config.scenarioType === 'hurricane'
    ? generateHurricaneEOCActions(config)
    : generateHurricaneEOCActions(config); // Default to hurricane for now

  return {
    scenarioType: config.scenarioType,
    location: config.location,
    severity: config.severity,
    population: config.population,
    periods: periods.map(period => ({
      ...period,
      injects: injectsMap[period.periodNumber] || [],
      eocActions: actionsMap[period.periodNumber] || []
    }))
  };
}
