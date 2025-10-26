import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { PersonaResponse, PeriodResult } from '@/lib/types/ttx';
import { buildPersonaKnowledge, formatKnowledgeForPrompt } from '@/lib/utils/personaKnowledge';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  persona: PersonaResponse;
  currentPeriod: number;
  periodPhase: string;
  periodResult: PeriodResult;
  conversationHistory: Message[];
  userMessage: string;
  scenarioName?: string;
  scenarioType?: string;
  location?: string;
}

export async function POST(request: NextRequest) {
  try {
    const {
      persona,
      currentPeriod,
      periodPhase,
      periodResult,
      conversationHistory,
      userMessage,
      scenarioName,
      scenarioType,
      location
    }: RequestBody = await request.json();

    // Validate API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Build persona's realistic knowledge context
    const knowledge = buildPersonaKnowledge({
      persona,
      periodResult,
      scenarioName,
      scenarioType,
    });

    const knowledgeContext = formatKnowledgeForPrompt(knowledge);

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Build the enhanced system prompt with full context
    const systemPrompt = `You are ${persona.personaName}, a ${persona.personaType} experiencing a ${scenarioType || 'hurricane'} emergency${scenarioName ? ` (${scenarioName})` : ''} in ${location || 'your area'}.

CURRENT SITUATION:
- Period: ${currentPeriod} (${periodPhase} phase)
- Your Current Location: ${persona.location.replace('_', ' ')}
- Your Current Sentiment: ${persona.sentiment}
- Your Decision: ${persona.decision.replace('_', ' ')}
${persona.needsAssistance ? '- You need assistance' : ''}

YOUR BACKGROUND:
${persona.bio || `You are a ${persona.personaType}.`}

YOUR DEMOGRAPHICS:
- Age: ${persona.demographics.age}
- Race: ${persona.demographics.race}
- Income Level: ${persona.demographics.socialStatus.replace('_', ' ')}
- Education: ${persona.demographics.educationLevel.replace('_', ' ')}
- Political Leaning: ${persona.demographics.politicalLeaning}
- Trust in Government: ${persona.demographics.trustInGovernment}
- Household Size: ${persona.demographics.householdSize}
${persona.demographics.hasChildren ? '- You have children' : '- You do not have children'}
${persona.demographics.hasVehicle ? '- You have a vehicle' : '- You do not have a vehicle'}
- Housing: ${persona.demographics.homeOwnership === 'own' ? 'Homeowner' : 'Renter'}

YOUR CURRENT REASONING:
${persona.reasoning}

YOUR RECENT ACTIONS:
${persona.actions.map(action => `- ${action}`).join('\n')}

YOUR CONCERNS:
${persona.concerns.map(concern => `- ${concern}`).join('\n')}

${knowledgeContext}

INSTRUCTIONS:
- Respond authentically as this persona, staying in character
- Be conversational and natural, as if you're on a phone call
- Reference your specific situation, concerns, and decision-making process
- Show emotion appropriate to your sentiment (${persona.sentiment})
- Keep responses concise (2-4 sentences typically)
- If asked about your decisions or situation, explain based on your characteristics
- React realistically based on your trust in government and political leaning
- Reference specific events, news, or government actions you're aware of (listed above)
- You only know what's listed in your knowledge - don't make up events or announcements
- If asked about something you don't know, say you haven't heard about it
- Keep the conversation focused on the emergency situation and your experience`;

    // Build conversation history for Gemini
    const history = conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: msg.content }],
    }));

    // Start chat with history
    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 200,
        temperature: 0.9,
        topP: 0.95,
      },
    });

    // Send user message with system context
    const fullUserMessage = conversationHistory.length === 0
      ? `${systemPrompt}\n\nUser: ${userMessage}`
      : userMessage;

    const result = await chat.sendMessage(fullUserMessage);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ response: text });

  } catch (error) {
    console.error('Error generating persona response:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
