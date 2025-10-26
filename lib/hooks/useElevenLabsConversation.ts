import { useCallback, useEffect, useRef, useState } from 'react';
import type { PersonaResponse, PeriodResult } from '@/lib/types/ttx';
import { buildPersonaKnowledge } from '@/lib/utils/personaKnowledge';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface UseElevenLabsConversationProps {
  persona: PersonaResponse | null;
  periodResult: PeriodResult | null;
  scenarioName?: string;
  scenarioType?: string;
  location?: string;
}

/**
 * Hook to manage ElevenLabs Conversational AI sessions
 *
 * Note: This uses the ElevenLabs Conversational AI SDK which handles:
 * - Voice input (microphone)
 * - AI response generation
 * - Voice output (text-to-speech)
 * - Turn-taking and interruption handling
 *
 * All in one seamless voice-to-voice conversation.
 */
export function useElevenLabsConversation({
  persona,
  periodResult,
  scenarioName,
  scenarioType,
  location,
}: UseElevenLabsConversationProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Reference to the conversation session
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  /**
   * Builds dynamic variables to pass to the ElevenLabs agent
   * These populate the {{variable_name}} placeholders in the agent's system prompt
   */
  const buildDynamicVariables = useCallback(() => {
    if (!persona || !periodResult) return {};

    const knowledge = buildPersonaKnowledge({
      persona,
      periodResult,
      scenarioName,
      scenarioType,
    });

    // Format arrays as readable strings
    const recentActions = persona.actions.join('\n• ');
    const concerns = persona.concerns.join('\n• ');
    const knownInjects = knowledge.knownInjects
      .map(i => `• ${i.title}: ${i.description} (${i.time})`)
      .join('\n');
    const knownEOCActions = knowledge.knownEOCActions
      .map(a => `• ${a.actionType.replace('_', ' ').toUpperCase()}: ${a.details} (${a.time})`)
      .join('\n');

    return {
      // Basic persona info
      persona_name: persona.personaName,
      persona_type: persona.personaType,
      persona_age: persona.demographics.age.toString(),
      persona_bio: persona.bio || `A ${persona.personaType} experiencing this emergency.`,

      // Scenario context
      scenario_type: scenarioType || 'hurricane',
      scenario_name: scenarioName || '',
      location: location || 'your area',
      period_phase: periodResult.operationalPeriod.phase,
      period_label: periodResult.operationalPeriod.label,

      // Current status
      current_location: persona.location.replace('_', ' '),
      sentiment: persona.sentiment,
      current_decision: persona.decision.replace('_', ' '),
      needs_assistance: persona.needsAssistance ? 'true' : 'false',

      // Demographics
      income_level: persona.demographics.socialStatus.replace('_', ' '),
      education_level: persona.demographics.educationLevel.replace('_', ' '),
      trust_level: persona.demographics.trustInGovernment,
      political_leaning: persona.demographics.politicalLeaning,
      has_children: persona.demographics.hasChildren ? 'true' : 'false',
      has_children_text: persona.demographics.hasChildren ? '**You have children who depend on you**' : 'No children',
      has_vehicle: persona.demographics.hasVehicle ? 'true' : 'false',
      has_vehicle_text: persona.demographics.hasVehicle ? 'You have a vehicle' : '**You do NOT have a vehicle**',
      household_size: persona.demographics.householdSize.toString(),
      home_ownership: persona.demographics.homeOwnership === 'own' ? 'Homeowner' : 'Renter',

      // Current thinking
      reasoning: persona.reasoning,
      recent_actions: recentActions ? `• ${recentActions}` : 'None yet',
      concerns: concerns ? `• ${concerns}` : 'None specific',

      // Knowledge context
      awareness_level: knowledge.awarenessLevel,
      scenario_awareness: knowledge.scenarioAwareness,
      information_sources: knowledge.informationSources.join(', '),
      known_injects: knownInjects || 'You haven\'t been following the news closely',
      known_eoc_actions: knownEOCActions || 'You haven\'t heard any official announcements',
    };
  }, [persona, periodResult, scenarioName, scenarioType, location]);

  /**
   * Start a conversation session with the persona
   */
  const startConversation = useCallback(async () => {
    if (!persona || !periodResult) {
      setError('Persona or period data not available');
      return;
    }

    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

    if (!agentId) {
      setError('ElevenLabs Agent ID not configured. Please set NEXT_PUBLIC_ELEVENLABS_AGENT_ID in your environment variables.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Import the ElevenLabs SDK dynamically
      // This allows the app to work even if the SDK isn't fully compatible
      const { Conversation } = await import('@elevenlabs/client');

      const dynamicVariables = buildDynamicVariables();

      // Note: The actual SDK API may differ from this structure
      // This is based on the Python SDK and may need adjustment for JavaScript
      const session = new Conversation({
        agentId,
        apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,
        config: {
          dynamicVariables,
        },
        onConnect: () => {
          console.log('🎙️ Connected to ElevenLabs Conversational AI');
          setIsConnected(true);
          setIsConnecting(false);
        },
        onDisconnect: () => {
          console.log('📵 Disconnected from ElevenLabs');
          setIsConnected(false);
        },
        onMessage: (message: any) => {
          // Add message to transcript
          setTranscript(prev => [...prev, {
            role: message.source === 'ai' ? 'assistant' : 'user',
            text: message.message || message.text,
            timestamp: new Date(),
          }]);
        },
        onError: (error: any) => {
          console.error('ElevenLabs conversation error:', error);
          setError(error.message || 'Conversation error occurred');
          setIsConnecting(false);
        },
      });

      await session.startSession();
      sessionRef.current = session;

    } catch (error) {
      console.error('Failed to start ElevenLabs conversation:', error);
      setError(error instanceof Error ? error.message : 'Failed to start conversation');
      setIsConnecting(false);
    }
  }, [persona, periodResult, buildDynamicVariables]);

  /**
   * End the current conversation session
   */
  const endConversation = useCallback(async () => {
    if (sessionRef.current) {
      try {
        await sessionRef.current.endSession();
        sessionRef.current = null;
        setIsConnected(false);
        console.log('✅ Conversation ended');
      } catch (error) {
        console.error('Error ending conversation:', error);
      }
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current.endSession?.();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    startConversation,
    endConversation,
    isConnected,
    isConnecting,
    transcript,
    error,
  };
}
