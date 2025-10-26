'use client';

import { useMemo, useEffect, useState } from 'react';
import { useTTXStoreV2 } from '@/lib/stores/ttxStoreV2';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useConversation } from '@elevenlabs/react';
import { buildPersonaKnowledge } from '@/lib/utils/personaKnowledge';
import { OrbDemo } from '@/components/ui/orb-demo';

interface PersonaRunData {
  author: string;
  content: {
    parts: Array<{
      text: string;
    }>;
  };
  actions: {
    stateDelta: {
      [key: string]: {
        bio: string;
        response: Array<{
          decision: string;
          sentiment: string;
          location: string;
          actions_taken: string[];
          personality_reasoning: string;
        }>;
      };
    };
  };
}

export function PhoneInterviewModal() {
  const scenario = useTTXStoreV2((state) => state.scenario);
  const currentPeriod = useTTXStoreV2((state) => state.currentPeriod);
  const interviewPersonaId = useTTXStoreV2((state) => state.interviewPersonaId);
  const setInterviewPersona = useTTXStoreV2((state) => state.setInterviewPersona);

  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

  // Load run_output.json data
  const [runOutputData, setRunOutputData] = useState<PersonaRunData[] | null>(null);

  useEffect(() => {
    fetch('/data/run_output.json')
      .then(res => res.json())
      .then(data => setRunOutputData(data))
      .catch(err => console.error('Failed to load run_output.json:', err));
  }, []);

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
    if (!persona || !periodResult || !runOutputData) return {};

    // Find the persona's run data by matching personaId with author field
    const personaRunData = runOutputData.find(p => {
      // The author field might match persona.personaId or be similar
      // Try exact match first, then partial match
      return p.author === interviewPersonaId ||
             p.author.includes(interviewPersonaId.split('_')[0]);
    });

    if (!personaRunData) {
      console.warn('No run data found for persona:', interviewPersonaId);
      return {};
    }

    // Get the first key from stateDelta (it's the persona key)
    const personaKey = Object.keys(personaRunData.actions.stateDelta)[0];
    const personaData = personaRunData.actions.stateDelta[personaKey];

    // Extract responses up to current period (0-indexed, so currentPeriod - 1)
    const responsesUpToNow = personaData.response.slice(0, currentPeriod);

    // Format chronological event history
    const eventHistory = responsesUpToNow.map((response, idx) => {
      const phaseNum = idx + 1;
      const events = response.actions_taken.join(' → ');
      return `**Phase ${phaseNum}**: ${events}`;
    }).join('\n\n');

    // Get current phase data
    const currentPhaseResponse = responsesUpToNow[currentPeriod - 1];

    const knowledge = buildPersonaKnowledge({
      persona,
      periodResult,
      scenarioName: scenario?.ttxScript?.name,
      scenarioType: scenario?.ttxScript?.scenarioType,
    });

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
      persona_bio: personaData.bio,

      // Scenario context
      scenario_type: scenario?.ttxScript?.scenarioType || 'hurricane',
      scenario_name: scenario?.ttxScript?.name || '',
      location: scenario?.ttxScript?.location || 'your area',
      period_phase: periodResult.operationalPeriod.phase,
      period_label: periodResult.operationalPeriod.label,
      current_period: currentPeriod.toString(),

      // Current status (from run_output.json)
      current_location: currentPhaseResponse.location.replace('_', ' '),
      sentiment: currentPhaseResponse.sentiment,
      current_decision: currentPhaseResponse.decision.replace('_', ' '),
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

      // Current thinking (from run_output.json)
      reasoning: currentPhaseResponse.personality_reasoning,

      // EVENT HISTORY: Chronological timeline from start to current phase
      event_history: eventHistory,
      recent_actions: currentPhaseResponse.actions_taken.join('\n• '),

      concerns: persona.concerns.join('\n• ') || 'None specific',

      // Knowledge context
      awareness_level: knowledge.awarenessLevel,
      scenario_awareness: knowledge.scenarioAwareness,
      information_sources: knowledge.informationSources.join(', '),
      known_injects: knownInjects || 'You haven\'t been following the news closely',
      known_eoc_actions: knownEOCActions || 'You haven\'t heard any official announcements',
    };
  }, [persona, periodResult, scenario, runOutputData, currentPeriod, interviewPersonaId]);

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

  if (!agentId) {
    return (
      <Dialog open={!!interviewPersonaId} onOpenChange={(open) => !open && setInterviewPersona(null)}>
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
    <Dialog open={!!interviewPersonaId} onOpenChange={(open) => !open && setInterviewPersona(null)}>
      <DialogContent className="max-w-2xl bg-gradient-to-b from-gray-900 to-gray-800 text-white border-gray-700">
        <DialogHeader className="sr-only">
          <DialogTitle>Conversation with {persona?.personaName}</DialogTitle>
        </DialogHeader>

        {persona && (
          <div className="w-full">
            {/* Persona Info Header */}
            <div className="mb-4 text-center">
              <h3 className="text-xl font-semibold">{persona.personaName}</h3>
              <p className="text-sm text-gray-400">{persona.personaType}</p>
              {conversation.status && (
                <p className="text-xs text-green-400 mt-2">
                  Status: {conversation.status}
                </p>
              )}
            </div>

            {/* Orb Visualization */}
            <div className="flex items-center justify-center">
              <OrbDemo />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
