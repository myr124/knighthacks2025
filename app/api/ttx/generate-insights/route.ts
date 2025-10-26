import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { retryGeminiCall, summarizePeriodResults } from '@/lib/utils/geminiRetry';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface Insight {
  id: string;
  observation: string;
  rootCause: string;
  recommendation: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
}

async function generateInsights(scenarioData: any): Promise<Insight[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // Summarize data to reduce token usage
  const summarizedPeriods = summarizePeriodResults(scenarioData.periodResults);

  const prompt = `
You are an expert emergency management analyst conducting an After-Action Review (AAR) of a tabletop exercise (TTX) simulation.

Analyze the following scenario summary and generate 3-5 key insights with root cause analysis and actionable recommendations.

**Scenario Information:**
Name: ${scenarioData.ttxScript?.name || 'Emergency Simulation'}
Type: ${scenarioData.ttxScript?.scenarioType || 'disaster'}
Location: ${scenarioData.ttxScript?.location || 'N/A'}
Total Periods: ${scenarioData.periodResults?.length || 0}

**Period Summaries:**
${JSON.stringify(summarizedPeriods, null, 2)}

**Instructions:**
1. Analyze the complete simulation data, including:
   - Evacuation patterns and compliance rates across all periods
   - Sentiment trends and anxiety levels throughout the simulation
   - Decision-making patterns across different persona types
   - Timing and effectiveness of EOC actions
   - Critical issues identified in each period
   - Resource allocation and assistance needs

2. Identify 3-5 KEY INSIGHTS that represent the most critical findings. Each insight must include:
   - A clear, data-driven OBSERVATION (what happened)
   - A detailed ROOT CAUSE ANALYSIS (why it happened, based on persona reasoning, timing, demographics)
   - An ACTIONABLE RECOMMENDATION (specific, implementable improvement)
   - A SEVERITY level (high, medium, or low)
   - A CATEGORY (e.g., "Evacuation Coordination", "Resource Allocation", "Public Warning & Communication", "Best Practices")

3. Focus on:
   - Systemic issues that affected multiple personas or periods
   - Timing problems (too early/late actions)
   - Communication gaps or failures
   - Resource constraints or misallocations
   - Successful strategies worth reinforcing

**Response Format:**
Return ONLY a valid JSON array of insights. Each insight must follow this exact structure:

[
  {
    "id": "insight-1",
    "observation": "Specific, measurable observation with data",
    "rootCause": "Detailed analysis of underlying causes, referencing persona types and timing",
    "recommendation": "Specific, actionable recommendation with concrete steps",
    "severity": "high" | "medium" | "low",
    "category": "Category name"
  }
]

**Important:**
- Be specific and cite actual data from the simulation
- Reference persona types (e.g., "Skeptic personas", "Resource Constrained personas")
- Include timing information (e.g., "T-38h", "Period 8")
- Make recommendations concrete and implementable
- Return ONLY the JSON array, no additional text or markdown formatting
`;

  try {
    // Use retry logic to handle rate limits
    const result = await retryGeminiCall(
      async () => await model.generateContent(prompt),
      { maxRetries: 2, initialDelay: 2000, maxDelay: 30000 }
    );
    const response = await result.response;
    const text = await response.text();

    // Remove markdown code blocks if present
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const insights = JSON.parse(cleanedText);

    // Validate the insights
    if (!Array.isArray(insights)) {
      throw new Error('Response is not an array');
    }

    // Ensure all insights have required fields
    insights.forEach((insight, index) => {
      if (!insight.id) insight.id = `insight-${index + 1}`;
      if (!insight.observation) throw new Error(`Insight ${index} missing observation`);
      if (!insight.rootCause) throw new Error(`Insight ${index} missing rootCause`);
      if (!insight.recommendation) throw new Error(`Insight ${index} missing recommendation`);
      if (!insight.severity) insight.severity = 'medium';
      if (!insight.category) insight.category = 'General';
    });

    return insights;
  } catch (error) {
    console.error('Error generating insights with Gemini API:', error);
    throw new Error('Failed to generate AI insights');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('generate-insights request received');

    const { scenarioData } = body;

    if (!scenarioData || !scenarioData.periodResults) {
      return NextResponse.json(
        { error: 'Missing required scenarioData with periodResults' },
        { status: 400 }
      );
    }

    const insights = await generateInsights(scenarioData);

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Error in generate-insights route:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate insights',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
