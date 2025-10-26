'use client';

import { useMemo, useEffect } from 'react';
import { useTTXStoreV2 } from '@/lib/stores/ttxStoreV2';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useConversation } from '@elevenlabs/react';

export function PhoneInterviewModal() {
  const scenario = useTTXStoreV2((state) => state.scenario);
  const currentPeriod = useTTXStoreV2((state) => state.currentPeriod);
  const interviewPersonaId = useTTXStoreV2((state) => state.interviewPersonaId);
  const setInterviewPersona = useTTXStoreV2((state) => state.setInterviewPersona);

  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

  // Initialize ElevenLabs conversation
  const conversation = useConversation({
    onConnect: () => console.log('✅ Connected to ElevenLabs agent'),
    onDisconnect: () => console.log('📵 Disconnected from ElevenLabs agent'),
    onMessage: (message) => console.log('💬 Message:', message),
    onError: (error) => console.error('❌ ElevenLabs error:', error),
  });

  // Get current persona and period result
  const persona = scenario?.periodResults[currentPeriod - 1]?.personaResponses.find(
    p => p.personaId === interviewPersonaId
  );

  const periodResult = scenario?.periodResults[currentPeriod - 1];

  // Build dynamic variables for the agent
  const customOverrides = useMemo(() => {
    if (!persona || !periodResult) return {};

    return {
      // Basic persona info
      persona_name: persona.personaName,
      persona_type: persona.personaType,
      persona_age: persona.demographics.age.toString(),
      persona_bio: persona.bio || `A ${persona.personaType} experiencing this emergency.`,

      // Scenario context
      scenario_type: scenario?.ttxScript?.scenarioType || 'hurricane',
      scenario_name: scenario?.ttxScript?.name || '',
      location: scenario?.ttxScript?.location || 'your area',
      period_phase: periodResult.operationalPeriod.phase,
      period_label: periodResult.operationalPeriod.label,
      current_period: currentPeriod.toString(),

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
      recent_actions: persona.actions.join('\n• '),
      concerns: persona.concerns.join('\n• ') || 'None specific',

      // Placeholders for knowledge (would come from personaKnowledge.ts if implemented)
      awareness_level: 'medium',
      scenario_awareness: `You are aware of the ${scenario?.ttxScript?.scenarioType || 'emergency'} situation and have been following updates.`,
      information_sources: 'TV news, radio, word of mouth',
      known_injects: 'General emergency updates',
      known_eoc_actions: 'Public safety announcements',
      past_phases_summary: 'This is your current situation during the emergency.',
      emotional_journey: `Currently feeling ${persona.sentiment}`,
    };
  }, [persona, periodResult, scenario, currentPeriod]);

  // Handle hang up - end conversation and close modal
  const handleHangUp = async () => {
    if (conversation.status === 'connected') {
      await conversation.endSession();
    }
    setInterviewPersona(null);
  };

  // Handle dialog close - also end conversation
  const handleDialogClose = async (open: boolean) => {
    if (!open) {
      if (conversation.status === 'connected') {
        await conversation.endSession();
      }
      setInterviewPersona(null);
    }
  };

  // Start conversation when modal opens
  useEffect(() => {
    if (!agentId || !interviewPersonaId || !persona || !customOverrides) return;

    const startConversation = async () => {
      try {
        await conversation.startSession({
          agentId,
          overrides: customOverrides,
        });
      } catch (error) {
        console.error('Failed to start conversation:', error);
      }
    };

    startConversation();

    // Cleanup: end conversation when modal closes
    return () => {
      if (conversation.status === 'connected') {
        conversation.endSession();
      }
    };
  }, [interviewPersonaId, agentId, persona]);

  // If no agent ID configured, show error message
  if (!agentId) {
    return (
      <Dialog open={!!interviewPersonaId} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-md bg-gradient-to-b from-gray-900 to-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Configuration Required</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center">
            <p className="text-red-400 mb-2">ElevenLabs Agent ID not configured</p>
            <p className="text-sm text-gray-400">
              Please set NEXT_PUBLIC_ELEVENLABS_AGENT_ID in your .env.local file
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={!!interviewPersonaId} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-b from-gray-900 to-gray-800 text-white border-gray-700">
        <DialogHeader className="sr-only">
          <DialogTitle>Conversation with {persona?.personaName}</DialogTitle>
        </DialogHeader>

        {persona && (
          <div className="w-full">
            {/* Persona Avatar and Info */}
            <div className="mb-6 text-center">
              {/* User Avatar Circle */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="h-32 w-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1 shadow-xl">
                    <div className="h-full w-full rounded-full bg-gray-800 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-16 w-16 text-white"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  {/* Status Indicator */}
                  {conversation.status === 'connected' && (
                    <div className="absolute bottom-2 right-2 h-4 w-4 rounded-full bg-green-500 border-2 border-gray-800 animate-pulse" />
                  )}
                </div>
              </div>

              {/* Persona Info */}
              <h3 className="text-xl font-semibold">{persona.personaName}</h3>
              <p className="text-sm text-gray-400">{persona.personaType}</p>
              {conversation.status && (
                <p className="text-xs text-green-400 mt-2">
                  Status: {conversation.status}
                </p>
              )}
            </div>

            {/* Hang Up Button */}
            <div className="flex justify-center">
              <button
                onClick={handleHangUp}
                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full
                         transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105
                         flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  <path
                    fillRule="evenodd"
                    d="M15.707 4.293a1 1 0 010 1.414l-9 9a1 1 0 01-1.414-1.414l9-9a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Hang Up
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
