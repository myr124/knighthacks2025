import { NextResponse } from 'next/server';

// Placeholder endpoint URL - replace with your actual API endpoint
const PLACEHOLDER_API_ENDPOINT = 'https://your-api-endpoint-here.com/api/ttx';

export async function GET() {
  try {
    console.log('Calling real API endpoint:', PLACEHOLDER_API_ENDPOINT);

    // Call the real API endpoint
    const response = await fetch(PLACEHOLDER_API_ENDPOINT, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API endpoint responded with status ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error calling API endpoint:', error);

    return NextResponse.json(
      {
        error: 'Failed to call API endpoint',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Update PLACEHOLDER_API_ENDPOINT in app/api/ttx/mock/route.ts with your actual API URL'
      },
      { status: 500 }
    );
  }
}

// Also support POST for consistency with generate-scenario API
export async function POST() {
  return GET();
}
