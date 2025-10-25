import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { transformADKToScenarioResults } from '@/lib/utils/adkTransformer';

// Cache for transformed data to avoid re-parsing on every request
let cachedScenarioResults: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

export async function GET() {
  try {
    // Check cache
    const now = Date.now();
    if (cachedScenarioResults && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('Returning cached ADK scenario data');
      return NextResponse.json(cachedScenarioResults);
    }

    // Read test.json from root directory
    const testJsonPath = join(process.cwd(), 'test.json');
    const fileContent = readFileSync(testJsonPath, 'utf-8');

    // Parse JSON
    const adkData = JSON.parse(fileContent);

    if (!Array.isArray(adkData)) {
      throw new Error('test.json should contain an array of ADK responses');
    }

    if (adkData.length === 0) {
      throw new Error('test.json is empty');
    }

    console.log(`Transforming ${adkData.length} ADK responses...`);

    // Transform to frontend format
    const scenarioResults = transformADKToScenarioResults(adkData);

    console.log(`Transformed ADK data: ${scenarioResults.periodResults.length} periods, ` +
      `${scenarioResults.periodResults[0]?.personaResponses.length || 0} personas per period`);

    // Cache the result
    cachedScenarioResults = scenarioResults;
    cacheTimestamp = now;

    return NextResponse.json(scenarioResults);

  } catch (error) {
    console.error('Error loading test.json:', error);

    return NextResponse.json(
      {
        error: 'Failed to load test.json',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Make sure test.json exists in the project root and contains valid ADK response data'
      },
      { status: 500 }
    );
  }
}

// Also support POST for consistency with generate-scenario API
export async function POST() {
  return GET();
}
