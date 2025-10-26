import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { TTXScript } from '@/lib/utils/ttxGenerator';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function generateFacilitatorScript(script: TTXScript): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const prompt = `You are an expert exercise facilitator. Based on the following TTX (Table Top eXercise) scenario script, generate a comprehensive facilitator guide that includes:

1. Opening remarks for the exercise start
2. For each operational period:
   - Period introduction and objectives
   - Key points to emphasize for each inject
   - Discussion questions to engage participants
   - Expected participant responses or actions
   - Transition points between periods
3. Closing remarks for the hot wash discussion

Format the output as a structured facilitator script with clear sections and bullet points.

**Scenario Details:**
- Type: ${script.scenarioType}
- Location: ${script.location}
- Severity: ${script.severity}
- Population: ${script.population}

**Scenario Periods and Injects:**
${script.periods
  .map(
    (period, idx) => `
**Period ${period.periodNumber}: ${period.label}** (${period.phase})

Injects:
${period.injects?.map((inj) => `- [${inj.time}] ${inj.title} (${inj.severity}): ${inj.description}`).join('\n') || '- No injects defined'}

EOC Actions:
${period.eocActions?.map((action) => `- [${action.time}] ${action.actionType}: ${action.details}`).join('\n') || '- No actions defined'}
`
  )
  .join('\n')}

Generate a detailed, practical facilitator script that will help guide this TTX exercise effectively.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    return text;
  } catch (error) {
    console.error('Error generating facilitator script with Gemini API:', error);
    throw new Error('Failed to generate facilitator script');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { script } = await request.json();

    if (!script) {
      return NextResponse.json({ error: 'Missing script parameter' }, { status: 400 });
    }

    const previewText = await generateFacilitatorScript(script);

    return NextResponse.json({ previewText, script });
  } catch (error) {
    console.error('Error in augment route:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate preview',
      },
      { status: 500 }
    );
  }
}
