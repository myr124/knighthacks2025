import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { retryGeminiCall, summarizePeriodResults } from '@/lib/utils/geminiRetry';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function generateAARDocument(scenarioData: any): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // Summarize data to reduce token usage
  const summarizedPeriods = summarizePeriodResults(scenarioData.periodResults);

  const prompt = `
You are an expert emergency management analyst writing a comprehensive After-Action Report / Improvement Plan (AAR/IP) for a tabletop exercise (TTX).

Generate a professional, formal AAR/IP document based on the following simulation summary:

**Scenario Information:**
Name: ${scenarioData.ttxScript?.name || 'Emergency Simulation'}
Type: ${scenarioData.ttxScript?.scenarioType || 'disaster'}
Location: ${scenarioData.ttxScript?.location || 'N/A'}
Duration: ${scenarioData.ttxScript?.startTime || 'N/A'} to ${scenarioData.ttxScript?.endTime || 'N/A'}
Status: ${scenarioData.status || 'completed'}
Total Periods: ${scenarioData.periodResults?.length || 0}

**Period Summaries:**
${JSON.stringify(summarizedPeriods, null, 2)}

**AAR/IP Document Requirements:**

Your document MUST follow the official Homeland Security Exercise and Evaluation Program (HSEEP) format for AAR/IP documents.

**Structure (use this exact outline):**

# AFTER-ACTION REPORT / IMPROVEMENT PLAN (AAR/IP)
## ${scenarioData.ttxScript?.name || 'Emergency Simulation'}

---

## EXECUTIVE SUMMARY
- Brief overview of the exercise (2-3 paragraphs)
- Key objectives tested
- Overall assessment of performance
- Major findings summary

## EXERCISE OVERVIEW

### Exercise Details
- Exercise Name
- Exercise Type (Tabletop Exercise)
- Exercise Date
- Duration
- Location
- Participating Organizations

### Exercise Objectives
List 3-5 key objectives that were tested during this simulation

### Scenario Summary
Detailed description of the scenario progression through all operational periods

## ANALYSIS OF CAPABILITIES

### Capability 1: Emergency Operations Coordination
**Performance Rating:** [Performed Well / Adequate Performance / Needs Improvement]

**Strengths:**
- [Bullet points based on data]

**Areas for Improvement:**
- [Bullet points based on data]

**Root Cause Analysis:**
- [Detailed analysis]

### Capability 2: Public Warning and Communication
**Performance Rating:** [Rating]

**Strengths:**
- [Data-driven points]

**Areas for Improvement:**
- [Data-driven points]

**Root Cause Analysis:**
- [Analysis based on persona responses and timing]

### Capability 3: Mass Evacuation and Sheltering
**Performance Rating:** [Rating]

**Strengths:**
- [Include evacuation rates, compliance data]

**Areas for Improvement:**
- [Include specific persona types, barriers identified]

**Root Cause Analysis:**
- [Why certain groups didn't evacuate, timing issues]

### Capability 4: Resource Management and Logistics
**Performance Rating:** [Rating]

**Strengths:**
- [Resource allocation successes]

**Areas for Improvement:**
- [Resource gaps, assistance needs]

**Root Cause Analysis:**
- [Why resources were insufficient or poorly timed]

## IMPROVEMENT PLAN

Create a table with the following columns:
1. Issue/Observation
2. Root Cause
3. Recommendation
4. Capability Affected
5. Priority (High/Medium/Low)
6. Primary Responsible Organization
7. Estimated Timeline

Include 8-12 actionable improvement items derived from the analysis.

## CONCLUSION

Summarize overall performance, key lessons learned, and next steps for implementation.

---

**Instructions:**
1. Analyze ALL period results thoroughly
2. Reference specific data points (percentages, counts, timing)
3. Cite specific persona types and their behaviors
4. Identify patterns across multiple periods
5. Be professional and objective
6. Make all recommendations SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
7. Return the document in clean Markdown format
8. Use actual numbers and statistics from the simulation data
9. Reference specific operational periods and times (e.g., "Period 8, T-38h")

Generate the complete AAR/IP document now.
`;

  try {
    // Use retry logic to handle rate limits
    const result = await retryGeminiCall(
      async () => await model.generateContent(prompt),
      { maxRetries: 2, initialDelay: 2000, maxDelay: 30000 }
    );
    const response = await result.response;
    const text = await response.text();

    // Clean up the response (remove code blocks if present)
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```markdown')) {
      cleanedText = cleanedText.replace(/```markdown\n?/, '').replace(/\n?```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    return cleanedText;
  } catch (error) {
    console.error('Error generating AAR document with Gemini API:', error);
    throw new Error('Failed to generate AAR/IP document');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('generate-aar-document request received');

    const { scenarioData } = body;

    if (!scenarioData || !scenarioData.periodResults) {
      return NextResponse.json(
        { error: 'Missing required scenarioData with periodResults' },
        { status: 400 }
      );
    }

    const aarDocument = await generateAARDocument(scenarioData);

    return NextResponse.json({
      document: aarDocument,
      metadata: {
        scenarioName: scenarioData.ttxScript?.name || 'Emergency Simulation',
        location: scenarioData.ttxScript?.location || 'N/A',
        date: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Error in generate-aar-document route:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate AAR/IP document',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
