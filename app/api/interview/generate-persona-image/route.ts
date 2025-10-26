import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { PersonaDemographics } from '@/lib/types/ttx';

interface RequestBody {
  personaName: string;
  personaType: string;
  demographics: PersonaDemographics;
}

// Generate a detailed prompt for DALL-E based on persona demographics
function generateImagePrompt(personaName: string, personaType: string, demographics: PersonaDemographics): string {
  const { age, race, socialStatus } = demographics;

  // Determine age descriptor
  let ageDescriptor = '';
  if (age < 25) ageDescriptor = 'young';
  else if (age < 40) ageDescriptor = 'adult';
  else if (age < 60) ageDescriptor = 'middle-aged';
  else ageDescriptor = 'elderly';

  // Determine ethnicity descriptor
  const ethnicityMap: Record<string, string> = {
    white: 'Caucasian',
    black: 'African American',
    hispanic: 'Hispanic/Latino',
    asian: 'Asian',
    other: 'person'
  };
  const ethnicity = ethnicityMap[race] || 'person';

  // Determine style based on social status
  const styleMap: Record<string, string> = {
    low_income: 'casual, worn clothing',
    middle_income: 'neat, everyday clothing',
    high_income: 'professional, well-dressed'
  };
  const clothing = styleMap[socialStatus] || 'everyday clothing';

  const prompt = `Professional portrait photo of a ${ageDescriptor} ${ethnicity} person, around ${age} years old, wearing ${clothing}. Natural lighting, neutral background, realistic photography style, facing camera, friendly expression. High quality, detailed, photorealistic.`;

  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    const { personaName, personaType, demographics }: RequestBody = await request.json();

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Return a placeholder image if no API key is configured
      return NextResponse.json({
        imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(personaName)}&size=512&background=random`,
        isPlaceholder: true
      });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey });

    // Generate image prompt
    const prompt = generateImagePrompt(personaName, personaType, demographics);

    // Call DALL-E to generate image
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    const imageUrl = response.data[0]?.url;

    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    return NextResponse.json({
      imageUrl,
      isPlaceholder: false,
      prompt // Include prompt for debugging
    });

  } catch (error) {
    console.error('Error generating persona image:', error);

    // Return fallback placeholder on error
    const { personaName } = await request.json();
    return NextResponse.json({
      imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(personaName || 'User')}&size=512&background=random`,
      isPlaceholder: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
