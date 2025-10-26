// Utilities to convert between the editor script shape and the emergency_plan JSON shape

import type { OperationalPeriod as EditorOperationalPeriod, Inject as EditorInject, EOCAction as EditorEOCAction, TTXScript as EditorTTXScript } from '@/lib/utils/ttxGenerator';

// Emergency plan JSON shape expected by emergency_plan.txt
export interface EmergencyPlanPeriod {
  periodNumber: number;
  startTime?: string;
  endTime?: string;
  phase: 'planning' | 'preparation' | 'response' | 'recovery';
  injects: Array<Pick<EditorInject, 'time' | 'severity' | 'type' | 'title' | 'description'>>;
  eocActions: Array<Pick<EditorEOCAction, 'time' | 'actionType' | 'details' | 'targetPopulation' | 'urgency' | 'zone'>>;
}

export interface EmergencyPlan {
  scenarioId: string;
  scenarioType: string;
  location: string;
  severity?: string;
  timeTillLandfall?: number;
  totalOperationalPeriods: number;
  actionPlan: {
    periods: EmergencyPlanPeriod[];
  };
}

// Convert editor script into EmergencyPlan JSON
export function toEmergencyPlan(script: EditorTTXScript, scenarioId?: string): EmergencyPlan {
  const safeScenarioId = scenarioId ?? (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `scn-${Date.now()}`);

  return {
    scenarioId: safeScenarioId,
    scenarioType: script.scenarioType,
    location: script.location,
    severity: (script as any).severity,
    timeTillLandfall: (script as any).time ?? undefined,
    totalOperationalPeriods: script.periods.length,
    actionPlan: {
      periods: script.periods.map((p) => ({
        periodNumber: p.periodNumber,
        // Some generators don’t include start/end at period level; keep optional if missing
        startTime: (p as any).startTime,
        endTime: (p as any).endTime,
        phase: p.phase,
        injects: p.injects.map((inj) => ({
          time: inj.time,
          severity: inj.severity,
          type: inj.type,
          title: inj.title,
          description: inj.description,
        })),
        eocActions: p.eocActions.map((a) => ({
          time: a.time,
          actionType: a.actionType,
          details: a.details,
          targetPopulation: a.targetPopulation,
          urgency: a.urgency,
          zone: a.zone,
        })),
      })),
    },
  };
}

// Convert EmergencyPlan JSON back to editor script shape so the UI can render it
export function emergencyPlanToScript(plan: EmergencyPlan): EditorTTXScript {
  const periods: (EditorOperationalPeriod & { injects: EditorInject[]; eocActions: EditorEOCAction[] })[] = plan.actionPlan.periods.map((pp, idx) => ({
    id: `op-${pp.periodNumber ?? idx + 1}`,
    periodNumber: pp.periodNumber ?? idx + 1,
    label: `OP ${pp.periodNumber ?? idx + 1}`,
    phase: pp.phase,
    // Keep times if present
    ...(pp.startTime ? { startTime: pp.startTime } : {}),
    ...(pp.endTime ? { endTime: pp.endTime } : {}),
    injects: pp.injects.map((inj, i) => ({
      id: `inj-${pp.periodNumber ?? idx + 1}-${i + 1}`,
      time: inj.time,
      severity: inj.severity,
      type: inj.type,
      title: inj.title,
      description: inj.description,
    })) as EditorInject[],
    eocActions: pp.eocActions.map((a, i) => ({
      id: `act-${pp.periodNumber ?? idx + 1}-${i + 1}`,
      time: a.time,
      actionType: a.actionType,
      details: a.details,
      targetPopulation: a.targetPopulation ?? '',
      urgency: a.urgency,
      zone: a.zone,
    })) as EditorEOCAction[],
  }));

  return {
    scenarioType: plan.scenarioType,
    location: plan.location,
    // Map optional fields if present
    severity: (plan as any).severity ?? 'moderate',
    population: 0,
    ...(plan.timeTillLandfall !== undefined ? { time: plan.timeTillLandfall } : {}),
    periods,
  };
}
