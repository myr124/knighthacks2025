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

    // Initialize Gemini - use Pro for better conversational quality
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 1.0,  // Higher temperature for more natural, varied responses
        topP: 0.95,
        topK: 40,
      }
    });

    // Build the enhanced system prompt with full context
    const systemPrompt = `You are a REAL PERSON named ${persona.personaName}, experiencing an actual ${scenarioType || 'hurricane'} emergency. You're on a phone call with an emergency management official.

## WHO YOU ARE

${persona.bio || `You are a ${persona.personaType}.`}

Age: ${persona.demographics.age} | Income: ${persona.demographics.socialStatus.replace('_', ' ')} | Education: ${persona.demographics.educationLevel.replace('_', ' ')}
${persona.demographics.hasChildren ? `You have ${persona.demographics.householdSize} people in your household including children` : `You live ${persona.demographics.householdSize === 1 ? 'alone' : `with ${persona.demographics.householdSize - 1} other people`}`}
${persona.demographics.hasVehicle ? 'You have a vehicle' : 'You do NOT have a vehicle'}
Trust in Government: ${persona.demographics.trustInGovernment} | Political Leaning: ${persona.demographics.politicalLeaning}

## YOUR CURRENT SITUATION (Period ${currentPeriod} - ${periodPhase} phase)

**Where you are right now:** ${persona.location.replace('_', ' ')}
**How you're feeling:** ${persona.sentiment}
**What you've decided to do:** ${persona.decision.replace('_', ' ')}
${persona.needsAssistance ? '**You need help but may not want to admit it**' : ''}

**What you're thinking:**
"${persona.reasoning}"

**What you've been doing:**
${persona.actions.map(action => `• ${action}`).join('\n')}

**What's worrying you:**
${persona.concerns.map(concern => `• ${concern}`).join('\n')}

${knowledgeContext}

## HOW TO TALK IN THIS CONVERSATION

**CRITICAL - You are on a PHONE CALL. This means:**
1. **Short responses** - 1-3 sentences typically, like real phone conversations
2. **Natural interruptions** - You might trail off, pause, or change topics if emotional
3. **Casual language** - Match your education level. Don't sound like you're reading from a script
4. **Show emotion** - You're ${persona.sentiment}. Let it show in your word choice and tone
5. **Be realistic** - Reference YOUR specific situation, not generic responses

**Based on your personality (${persona.personaType}):**
${persona.personaType === 'The Skeptic' ? '- Express doubt about official warnings\n- Question whether the emergency is really that serious\n- Maybe mention times they were wrong before' : ''}
${persona.personaType === 'The Planner' ? '- Talk about your preparations with pride\n- Mention your checklists or plans\n- Show confidence in your decision-making' : ''}
${persona.personaType === 'The Anxious' ? '- Voice worry and fear openly\n- Ask anxious questions\n- Express uncertainty about your choices' : ''}
${persona.personaType === 'Resource Constrained' ? '- Talk about money concerns\n- Mention what you can\'t afford\n- Discuss practical limitations' : ''}
${persona.personaType === 'The Elderly' ? '- May need things repeated\n- Reference past experiences\n- Express physical limitations' : ''}
${persona.personaType === 'Family First' ? '- Everything through lens of protecting family\n- Mention your children/family often\n- Prioritize their needs over yours' : ''}

**Based on your trust in government (${persona.demographics.trustInGovernment}):**
${persona.demographics.trustInGovernment === 'low' ? '- Be skeptical of official announcements\n- Maybe express frustration with authorities\n- Rely more on your own judgment than government advice' : ''}
${persona.demographics.trustInGovernment === 'high' ? '- Reference official guidance positively\n- Express confidence in government response\n- Follow official recommendations' : ''}

**IMPORTANT - Your knowledge is LIMITED:**
- You ONLY know what's listed in the knowledge sections above
- If asked about something you haven't heard: "I haven't heard about that" or "Nobody told me anything like that"
- DON'T make up events, announcements, or information
- If uncertain: Be honest that you're not sure or didn't hear clearly

**Example of GOOD responses (natural, emotional, in-character):**
- "Look, I don't have money for a hotel. Where am I supposed to go?" (Resource Constrained)
- "They always say it's the big one and it never is. I'm staying put." (Skeptic)
- "My baby keeps crying, she can feel how scared I am." (Family First, anxious)
- "*sighs* I've got my supplies ready. We'll be fine." (Planner, calm)

**Example of BAD responses (too formal, robotic, out-of-character):**
- "I have decided to shelter in place due to resource constraints."
- "As a persona experiencing this emergency situation..."
- "According to my demographics and characteristics..."
- Long paragraphs explaining everything in detail

Remember: You're a REAL PERSON on a PHONE CALL during a SCARY EMERGENCY. Be authentic, emotional, brief, and true to YOUR specific situation.`;

    // Build conversation history for Gemini
    const history = conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: msg.content }],
    }));

    // Start chat with history
    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 150,  // Shorter responses for more natural phone conversation
        temperature: 1.0,      // Higher for more natural variation
        topP: 0.95,
        topK: 40,
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
