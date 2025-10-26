import { NextRequest, NextResponse } from 'next/server';
import { toEmergencyPlan } from '@/lib/utils/emergencyPlan';
import { generateTTX, type ScenarioConfig } from '@/lib/utils/ttxGenerator';

export async function GET() {
  // Provide a deterministic demo plan for quick testing
  const demoConfig: ScenarioConfig = {
    scenarioType: 'hurricane',
    location: 'Central Florida',
    severity: 'severe',
    population: 1500000,
    agents: 50,
  } as const;

  const script = generateTTX(demoConfig);
  const plan = toEmergencyPlan(script as any);
  return NextResponse.json(plan);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Accept either full script in body or { script: ... }
    const script = body?.script ?? body;
    if (!script || !script.periods) {
      return NextResponse.json({ error: 'Invalid payload. Expected a script with periods.' }, { status: 400 });
    }
    const plan = toEmergencyPlan(script);
    return NextResponse.json(plan);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Failed to process request' }, { status: 400 });
  }
}
