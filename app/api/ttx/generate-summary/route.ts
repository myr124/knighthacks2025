
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function generateSummary(periodNumber: number, personaResponses: any[], criticalIssues: string[], injects: any[], eocActions: any[]) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `

    You are an expert summarizer for an emergency simulation. Your task is to generate a concise after-action summary based on the provided data.
    Analyze the following data for period ${periodNumber} of a hurricane simulation and provide a brief well-formatted summary.

    You MUST follow these formatting and content rules EXACTLY:

    NO TITLE: Do not include a title of any kind. Your response MUST begin directly with the first heading.

    EXACT HEADINGS: You MUST use the following three headings, in this exact order:

    Situation Overview

    Strengths/Positive Developments

    Areas of Concern

    BULLET POINTS: All information under each heading MUST be formatted as brief and concise bullet points.

    GENERIC PERSONAS: When referring to specific personas from the personaResponses data, you MUST speak in generics about their characteristics (e.g., "some residents," "concerned individuals," "local officials") rather than using specific names or identifiers.

    SYNTHESIZE ALL SOURCES: Your summary MUST be a combination of context synthesized from ALL of the following data sources provided in the user prompt:

    FORMATTING: Each section header must be bolded. The response should be markdown.

    **Injects (events that occurred this period):**
    ${JSON.stringify(injects, null, 2)}

    **EOC Actions (actions taken by the Emergency Operations Center):**
    ${JSON.stringify(eocActions, null, 2)}

    **Persona Responses:**
    ${JSON.stringify(personaResponses, null, 2)}
    Your response will be used for a formal report, so consistency and adherence to these rules are critical.
)}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    return text;
  } catch (error) {
    console.error('Error generating summary with Gemini API:', error);
    throw new Error('Failed to generate summary');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('generate-summary request body:', body);
    const { periodNumber, personaResponses, criticalIssues, injects, eocActions } = body;

    if (!periodNumber || !personaResponses || !criticalIssues || !injects || !eocActions) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const summary = await generateSummary(periodNumber, personaResponses, criticalIssues, injects, eocActions);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error in generate-summary route:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate summary',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
