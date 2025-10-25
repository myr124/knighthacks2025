
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function getChatReply(message: string, periodNumber: number, scenario: any, aiSummary: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const prompt = `
    You are a helpful assistant in a hurricane simulation. The user is asking for your help to understand the current situation.
    Current Period: ${periodNumber}
    AI Summary for this period:
    ${aiSummary}

    User's question: ${message}

    Based on the information above and the full scenario data below, provide a concise and helpful response.

    **Full Scenario Data:**
    ${JSON.stringify(scenario, null, 2)}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    return text;
  } catch (error) {
    console.error('Error generating chat reply with Gemini API:', error);
    throw new Error('Failed to generate chat reply');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, periodNumber, scenario, aiSummary } = await request.json();

    if (!message || !periodNumber || !scenario || !aiSummary) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const reply = await getChatReply(message, periodNumber, scenario, aiSummary);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate chat reply',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
