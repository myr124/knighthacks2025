import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import type { PersonaDemographics } from '@/lib/types/ttx';

interface RequestBody {
  text: string;
  demographics: PersonaDemographics;
  sentiment: string;
}

// Select voice based on demographics
function selectVoiceId(demographics: PersonaDemographics): string {
  // ElevenLabs pre-made voice IDs
  // You can customize these based on your ElevenLabs account

  const { age, race } = demographics;

  // Determine voice characteristics
  const isYoung = age < 35;
  const isMiddleAged = age >= 35 && age < 60;
  const isElderly = age >= 60;

  // Voice mapping with ElevenLabs voice IDs
  // Mix of your custom voices + common pre-made voices
  const voiceMap: Record<string, string> = {
    // Your custom voices
    'young_female': 'O4cGUVdAocn0z4EpQ9yF',      // young_professinal_american_female
    'young_male': 'D11AWvkESE7DJwqIVi7L',        // american_male

    // Common pre-made voices (these should work for most ElevenLabs accounts)
    'middle_female': 'EXAVITQu4vr4xnSDxMaL',     // Bella - young female
    'middle_male': 'VR6AewLTigWG4xSOukaG',       // Arnold - mature male
    'elderly_female': 'jsCqWAovK2LkecY7zXl4',    // Freya - young female
    'elderly_male': 'TxGEqnHWrfWFTfGW9XjX',      // Josh - deep male voice
  };

  // Simple voice selection logic based on age
  // You can make this more sophisticated based on other demographics
  let voiceKey: string;

  if (isYoung) {
    voiceKey = Math.random() > 0.5 ? 'young_male' : 'young_female';
  } else if (isMiddleAged) {
    voiceKey = Math.random() > 0.5 ? 'middle_male' : 'middle_female';
  } else {
    voiceKey = Math.random() > 0.5 ? 'elderly_male' : 'elderly_female';
  }

  return voiceMap[voiceKey] || 'O4cGUVdAocn0z4EpQ9yF'; // Default to your young_female voice
}

// Get voice settings based on sentiment
function getVoiceSettings(sentiment: string) {
  const settingsMap: Record<string, { stability: number; similarity_boost: number; style?: number }> = {
    calm: { stability: 0.75, similarity_boost: 0.75, style: 0.3 },
    concerned: { stability: 0.65, similarity_boost: 0.70, style: 0.5 },
    anxious: { stability: 0.55, similarity_boost: 0.65, style: 0.7 },
    panicked: { stability: 0.40, similarity_boost: 0.60, style: 0.9 },
    skeptical: { stability: 0.70, similarity_boost: 0.75, style: 0.4 },
    defiant: { stability: 0.60, similarity_boost: 0.70, style: 0.6 },
  };

  return settingsMap[sentiment] || { stability: 0.7, similarity_boost: 0.75 };
}

export async function POST(request: NextRequest) {
  try {
    const { text, demographics, sentiment }: RequestBody = await request.json();

    // Validate API key
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ELEVENLABS_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Initialize ElevenLabs client
    const client = new ElevenLabsClient({ apiKey });

    // Select appropriate voice
    const voiceId = selectVoiceId(demographics);
    const voiceSettings = getVoiceSettings(sentiment);

    // Generate speech
    const audio = await client.textToSpeech.convert(voiceId, {
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: voiceSettings,
    });

    // Convert audio stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }

    const audioBuffer = Buffer.concat(chunks);

    // Return audio as base64-encoded data URL
    const base64Audio = audioBuffer.toString('base64');
    const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`;

    return NextResponse.json({
      audioUrl: audioDataUrl,
      voiceId
    });

  } catch (error) {
    console.error('Error generating speech:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate speech',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
