import type { PersonaResponse, Inject, EOCAction, PeriodResult } from '@/lib/types/ttx';

/**
 * Filters and formats information that a persona would realistically know
 * based on their characteristics, information access, and behavior patterns
 */

interface PersonaKnowledgeContext {
  persona: PersonaResponse;
  periodResult: PeriodResult;
  scenarioName?: string;
  scenarioType?: string;
  location?: string;
}

interface FilteredKnowledge {
  knownInjects: Inject[];
  knownEOCActions: EOCAction[];
  informationSources: string[];
  awarenessLevel: 'low' | 'medium' | 'high';
  scenarioAwareness: string;
}

/**
 * Determines what information sources a persona has access to
 */
function getInformationSources(persona: PersonaResponse): string[] {
  const sources: string[] = [];

  const { socialStatus, educationLevel, trustInGovernment } = persona.demographics;
  const { personaType } = persona;

  // Everyone has some access to information
  sources.push('word of mouth');
  sources.push('neighbors');

  // Based on income/resources
  if (socialStatus === 'high_income') {
    sources.push('cable news');
    sources.push('internet');
    sources.push('social media');
    sources.push('weather apps');
    sources.push('emergency alerts');
  } else if (socialStatus === 'middle_income') {
    sources.push('local TV news');
    sources.push('internet');
    sources.push('social media');
    sources.push('emergency alerts');
  } else {
    // Low income - limited access
    sources.push('radio');
    sources.push('emergency alerts');
    // May have internet via phone but limited
  }

  // Based on persona type
  if (personaType === 'Information Seeker' || personaType === 'The Planner') {
    sources.push('National Weather Service');
    sources.push('local emergency management');
    sources.push('official websites');
  }

  if (personaType === 'Tech Savvy') {
    sources.push('Twitter/X');
    sources.push('weather radar apps');
    sources.push('emergency management apps');
  }

  // Elderly may prefer traditional sources
  if (personaType === 'The Elderly') {
    sources.push('TV news');
    sources.push('radio');
  }

  // Trust in government affects if they follow official sources
  if (trustInGovernment === 'high') {
    sources.push('official government announcements');
  }

  return [...new Set(sources)]; // Remove duplicates
}

/**
 * Filters injects (events/updates) that the persona would realistically know about
 */
function filterInjects(
  injects: Inject[],
  persona: PersonaResponse,
  sources: string[]
): Inject[] {
  const { trustInGovernment, educationLevel } = persona.demographics;
  const { personaType, sentiment } = persona;

  // Some personas ignore or don't pay attention to all updates
  if (personaType === 'The Skeptic' && sentiment === 'skeptical') {
    // Skeptics dismiss some warnings, especially early ones
    return injects.filter(inject => {
      // They notice high/critical severity
      if (inject.severity === 'critical' || inject.severity === 'high') {
        return true;
      }
      // Maybe notice medium severity (50% chance)
      if (inject.severity === 'medium') {
        return Math.random() > 0.5;
      }
      // Likely ignore low severity
      return false;
    });
  }

  if (personaType === 'The Optimist') {
    // Optimists may downplay or not fully absorb warnings
    return injects.filter(inject => {
      // Still aware of them, but may not take them as seriously
      return inject.severity !== 'low';
    });
  }

  if (personaType === 'Information Seeker' || personaType === 'The Planner') {
    // These personas know everything
    return injects;
  }

  // Most personas know about major updates
  return injects.filter(inject => {
    // Everyone knows critical/high
    if (inject.severity === 'critical' || inject.severity === 'high') {
      return true;
    }
    // May miss low severity updates
    if (inject.severity === 'low') {
      return Math.random() > 0.3; // 70% chance of knowing
    }
    return true;
  });
}

/**
 * Filters EOC actions (government orders/announcements) the persona would know about
 */
function filterEOCActions(
  eocActions: EOCAction[],
  persona: PersonaResponse,
  sources: string[]
): EOCAction[] {
  const { trustInGovernment } = persona.demographics;
  const { personaType } = persona;

  // Low trust personas may not pay attention to government announcements
  if (trustInGovernment === 'low') {
    // Still knows about mandatory evacuations (hard to miss)
    return eocActions.filter(action => {
      return action.urgency === 'mandatory' ||
             action.actionType === 'contraflow' ||
             action.actionType === 'shelter';
    });
  }

  // Skeptics may dismiss some announcements
  if (personaType === 'The Skeptic') {
    return eocActions.filter(action => {
      // Knows about big actions
      if (action.urgency === 'mandatory' || action.actionType === 'contraflow') {
        return true;
      }
      // May ignore public announcements
      return action.actionType !== 'public_announcement';
    });
  }

  // Most personas know about all major EOC actions
  return eocActions;
}

/**
 * Determines the persona's overall awareness level
 */
function calculateAwarenessLevel(persona: PersonaResponse, sources: string[]): 'low' | 'medium' | 'high' {
  const { personaType, sentiment } = persona;
  const { educationLevel, trustInGovernment } = persona.demographics;

  // High awareness personas
  if (personaType === 'Information Seeker' || personaType === 'The Planner' || personaType === 'Tech Savvy') {
    return 'high';
  }

  // Low awareness personas
  if (personaType === 'The Skeptic' && trustInGovernment === 'low') {
    return 'low';
  }

  if (sentiment === 'defiant' || sentiment === 'skeptical') {
    return 'low';
  }

  // Based on information access
  if (sources.length >= 6) {
    return 'high';
  } else if (sources.length >= 4) {
    return 'medium';
  }

  return 'low';
}

/**
 * Generates a summary of what the persona knows about the scenario
 */
function generateScenarioAwareness(
  periodResult: PeriodResult,
  persona: PersonaResponse,
  awarenessLevel: 'low' | 'medium' | 'high',
  scenarioName?: string,
  scenarioType?: string
): string {
  const { operationalPeriod } = periodResult;
  const phase = operationalPeriod.phase;

  let awareness = '';

  if (awarenessLevel === 'high') {
    awareness = `You are well-informed about the situation. You know this is a ${scenarioType || 'hurricane'} event${scenarioName ? ` named ${scenarioName}` : ''}. `;
    awareness += `You understand we are currently in the ${phase} phase, `;
    awareness += `at ${operationalPeriod.label}. `;
    awareness += `You've been following all updates closely.`;
  } else if (awarenessLevel === 'medium') {
    awareness = `You are aware of the ${scenarioType || 'hurricane'} threat and have heard some updates. `;
    awareness += `You know we're in the ${phase} phase right now. `;
    awareness += `You've seen some news but may have missed details.`;
  } else {
    awareness = `You know there's a ${scenarioType || 'storm'} coming but haven't been following it closely. `;
    awareness += `You've heard bits and pieces from neighbors and maybe seen something on TV. `;
    awareness += `You're not entirely sure what phase we're in or how serious it is.`;
  }

  return awareness;
}

/**
 * Main function to build complete knowledge context for a persona
 */
export function buildPersonaKnowledge(context: PersonaKnowledgeContext): FilteredKnowledge {
  const { persona, periodResult, scenarioName, scenarioType } = context;

  // Determine information sources
  const informationSources = getInformationSources(persona);

  // Calculate awareness level
  const awarenessLevel = calculateAwarenessLevel(persona, informationSources);

  // Filter what they know
  const knownInjects = filterInjects(periodResult.injects, persona, informationSources);
  const knownEOCActions = filterEOCActions(periodResult.eocActions, persona, informationSources);

  // Generate scenario awareness
  const scenarioAwareness = generateScenarioAwareness(
    periodResult,
    persona,
    awarenessLevel,
    scenarioName,
    scenarioType
  );

  return {
    knownInjects,
    knownEOCActions,
    informationSources,
    awarenessLevel,
    scenarioAwareness
  };
}

/**
 * Formats knowledge into a readable context string for the AI prompt
 */
export function formatKnowledgeForPrompt(knowledge: FilteredKnowledge): string {
  let context = '';

  // Scenario awareness
  context += `\nSCENARIO AWARENESS:\n${knowledge.scenarioAwareness}\n`;

  // Information sources
  context += `\nYOUR INFORMATION SOURCES:\n`;
  context += knowledge.informationSources.map(source => `- ${source}`).join('\n');
  context += `\n`;

  // Known events/updates
  if (knowledge.knownInjects.length > 0) {
    context += `\nRECENT NEWS/UPDATES YOU'VE HEARD:\n`;
    knowledge.knownInjects.forEach(inject => {
      context += `- ${inject.title}: ${inject.description} (${inject.time})\n`;
    });
  } else {
    context += `\nRECENT NEWS/UPDATES YOU'VE HEARD:\n`;
    context += `- You haven't been paying much attention to the news.\n`;
  }

  // Known government actions
  if (knowledge.knownEOCActions.length > 0) {
    context += `\nGOVERNMENT ACTIONS/ANNOUNCEMENTS YOU'RE AWARE OF:\n`;
    knowledge.knownEOCActions.forEach(action => {
      let urgencyText = action.urgency ? ` (${action.urgency})` : '';
      context += `- ${action.actionType.replace('_', ' ').toUpperCase()}${urgencyText}: ${action.details} (${action.time})\n`;
      if (action.zone) {
        context += `  Affects: ${action.zone}\n`;
      }
    });
  } else {
    context += `\nGOVERNMENT ACTIONS/ANNOUNCEMENTS YOU'RE AWARE OF:\n`;
    context += `- You haven't heard any official announcements or don't pay attention to them.\n`;
  }

  return context;
}
