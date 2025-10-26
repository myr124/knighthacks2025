/**
 * Utility for handling Gemini API calls with retry logic and rate limit handling
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
}

/**
 * Execute a Gemini API call with exponential backoff retry
 */
export async function retryGeminiCall<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 2, initialDelay = 1000, maxDelay = 30000 } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if it's a rate limit error (429)
      const isRateLimit = error?.message?.includes('429') ||
                         error?.message?.includes('Too Many Requests') ||
                         error?.message?.includes('Quota exceeded');

      // Check if it's the last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      let delay = initialDelay * Math.pow(2, attempt);

      // If rate limit error, try to parse the retry delay from error message
      if (isRateLimit) {
        const retryMatch = error.message?.match(/retry in ([\d.]+)s/i);
        if (retryMatch) {
          const suggestedDelay = parseFloat(retryMatch[1]) * 1000;
          delay = Math.min(suggestedDelay, maxDelay);
        }
      }

      // Cap at max delay
      delay = Math.min(delay, maxDelay);

      console.log(`⏳ Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Summarize period results for API calls to reduce token usage
 */
export function summarizePeriodResults(periodResults: any[]): any[] {
  return periodResults.map(period => ({
    periodNumber: period.periodNumber,
    phase: period.operationalPeriod?.phase,
    time: `${period.operationalPeriod?.startTime} to ${period.operationalPeriod?.endTime}`,
    aggregates: period.aggregates,
    criticalIssues: period.aggregates?.criticalIssues || [],
    injectCount: period.injects?.length || 0,
    actionCount: period.eocActions?.length || 0,
    // Include only summary stats, not full persona responses
    personaSummary: {
      total: period.personaResponses?.length || 0,
      decisions: period.aggregates?.decisions,
      sentiments: period.aggregates?.sentiments,
      locations: period.aggregates?.locations,
    }
  }));
}
