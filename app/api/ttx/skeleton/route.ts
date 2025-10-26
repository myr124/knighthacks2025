import { NextRequest, NextResponse } from 'next/server';
import type { ScenarioConfig, TTXScript, OperationalPeriod, Inject, EOCAction } from '@/lib/utils/ttxGenerator';
import { generateScenarioWithGemini, type ActionPlan } from '@/app/api/ttx/generate-scenario/models/gemini';

// Convert ActionPlan (Gemini/template) into a minimal TTXScript that the UI can render
function actionPlanToTTXScript(config: ScenarioConfig, plan: ActionPlan): TTXScript {
  const periods: (OperationalPeriod & { injects: Inject[]; eocActions: EOCAction[] })[] = plan.periods.map((p, idx) => {
    // Build injects and constrain to exactly 3
    const baseInjects = (p.injects || []).map((inj, i) => ({
      id: inj.id || `inj-${p.periodNumber ?? idx + 1}-${i + 1}`,
      time: inj.time,
      severity: inj.severity,
      type: inj.type,
      title: inj.title,
      description: inj.description,
    })) as Inject[];
    const injects = baseInjects.slice(0, 3);
    while (injects.length < 3) {
      const n = injects.length + 1;
      injects.push({
        id: `inj-${p.periodNumber ?? idx + 1}-${n}`,
        time: p.startTime || 'T0h',
        severity: 'medium',
        type: 'weather_update',
        title: `Update ${n}`,
        description: `Scenario update for ${config.location}.`,
      });
    }

    // Build actions and constrain to exactly 1
    const baseActions = (p.eocActions || []).map((a, i) => ({
      id: a.id || `act-${p.periodNumber ?? idx + 1}-${i + 1}`,
      time: a.time,
      actionType: a.actionType,
      details: a.details,
      targetPopulation: a.targetPopulation ?? '',
      urgency: a.urgency,
      zone: a.zone,
    })) as EOCAction[];
    const eocActions = baseActions.slice(0, 1);
    if (eocActions.length < 1) {
      eocActions.push({
        id: `act-${p.periodNumber ?? idx + 1}-1`,
        time: p.startTime || 'T0h',
        actionType: 'public_announcement',
        details: `Issue public update for ${config.location}.`,
        targetPopulation: 'All residents',
        urgency: undefined,
        zone: undefined,
      });
    }

    return {
      id: `op-${p.periodNumber ?? idx + 1}`,
      periodNumber: p.periodNumber ?? idx + 1,
      label: `${p.startTime?.toLowerCase?.() ?? ''} - ${p.endTime?.toLowerCase?.() ?? ''}`.trim(),
      phase: p.phase,
      injects,
      eocActions,
    };
  });

  return {
    scenarioType: config.scenarioType,
    location: config.location,
    severity: config.severity,
    time: config.time,
    population: config.population,
    periods,
  } as TTXScript;
}

export async function POST(req: NextRequest) {
  try {
    const config = (await req.json()) as ScenarioConfig;
    console.log('Received config:', config);
    if (!config || !config.scenarioType || !config.location || !config.severity) {
      return NextResponse.json({ error: 'Missing required fields in config.' }, { status: 400 });
    }

    const plan = await generateScenarioWithGemini({
      scenarioType: config.scenarioType,
      location: config.location,
      severity: config.severity,
      population: config.population,
      agents: config.agents,
    });

    console.log('Generated plan:', plan);

    const script = actionPlanToTTXScript(config, plan);
    return NextResponse.json(script);
  } catch (e: any) {
    console.error('Failed to generate skeleton via Gemini:', e);
    return NextResponse.json({ error: e?.message ?? 'Failed to generate script' }, { status: 500 });
  }
}
