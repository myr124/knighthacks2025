/**
 * Type definitions for persona run output data
 * This represents the detailed simulation responses from each persona
 */

export interface PersonaPhaseResponse {
  decision: string;
  sentiment: string;
  location: string;
  actions_taken: string[];
  personality_reasoning: string;
}

export interface PersonaRunData {
  author: string; // Persona identifier (e.g., "lowincome_4", "retired_2")
  content: {
    parts: Array<{
      text: string;
    }>;
  };
  actions: {
    stateDelta: {
      [key: string]: {
        race?: string;
        age?: number;
        sex?: string;
        bio: string;
        representation?: number;
        response: PersonaPhaseResponse[];
      };
    };
  };
  finishReason?: string;
  usageMetadata?: any;
  avgLogprobs?: number;
  invocationId?: string;
}
