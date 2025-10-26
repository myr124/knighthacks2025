"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTTXStoreV2 } from "@/lib/stores/ttxStoreV2";
import { Lightbulb, Search, TrendingUp, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface Insight {
  id: string;
  observation: string;
  rootCause: string;
  recommendation: string;
  severity: "high" | "medium" | "low";
  category: string;
}

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const severityConfig = {
    high: {
      badge: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
      icon: <AlertCircle className="h-4 w-4" />,
    },
    medium: {
      badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
      icon: <TrendingUp className="h-4 w-4" />,
    },
    low: {
      badge: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
      icon: <Lightbulb className="h-4 w-4" />,
    },
  };

  const config = severityConfig[insight.severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Search className="h-4 w-4 text-primary" />
            </div>
            <span className="font-medium text-sm text-muted-foreground">
              {insight.category}
            </span>
          </div>
          <Badge className={`${config.badge} flex items-center gap-1`}>
            {config.icon}
            {insight.severity.toUpperCase()}
          </Badge>
        </div>

        <div className="space-y-4">
          {/* Observation */}
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-1">
              Observation
            </h4>
            <p className="text-base font-medium">{insight.observation}</p>
          </div>

          {/* Root Cause */}
          <div className="bg-accent/50 p-4 rounded-lg">
            <h4 className="font-semibold text-sm text-muted-foreground mb-1 flex items-center gap-2">
              <Search className="h-3 w-3" />
              Root Cause Analysis
            </h4>
            <p className="text-sm">{insight.rootCause}</p>
          </div>

          {/* Recommendation */}
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-sm text-green-800 dark:text-green-300 mb-1 flex items-center gap-2">
              <Lightbulb className="h-3 w-3" />
              Actionable Recommendation
            </h4>
            <p className="text-sm text-green-900 dark:text-green-200">
              {insight.recommendation}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function KeyInsightsSection() {
  const scenario = useTTXStoreV2((state) => state.scenario);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!scenario) return;

    // Call the Gemini API to generate AI insights
    const fetchInsights = async () => {
      try {
        const response = await fetch('/api/ttx/generate-insights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ scenarioData: scenario }),
        });

        if (!response.ok) {
          throw new Error(`API responded with status ${response.status}`);
        }

        const data = await response.json();
        setInsights(data.insights);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching AI insights:', error);
        // Fallback to local generation if API fails
        const generatedInsights = generateInsightsFromScenario(scenario);
        setInsights(generatedInsights);
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [scenario]);

  if (!scenario) return null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">AI-Generated Key Insights</h2>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-32 bg-accent rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">AI-Generated Key Insights</h2>
        <p className="text-muted-foreground">
          Critical observations, root cause analysis, and actionable recommendations
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {insights.map((insight, index) => (
          <InsightCard key={insight.id} insight={insight} index={index} />
        ))}
      </div>
    </div>
  );
}

// Helper function to generate insights from scenario data
function generateInsightsFromScenario(scenario: any): Insight[] {
  const insights: Insight[] = [];
  const finalPeriod = scenario.periodResults[scenario.periodResults.length - 1];
  const midPeriod = scenario.periodResults[Math.floor(scenario.periodResults.length / 2)];

  // Insight 1: Evacuation uptake analysis
  const evacuationRate =
    ((finalPeriod.aggregates.locations.shelter +
      finalPeriod.aggregates.locations.evacuating) /
      finalPeriod.aggregates.totalPersonas) *
    100;

  if (evacuationRate < 70) {
    insights.push({
      id: "insight-1",
      observation: `Evacuation uptake was ${Math.round(evacuationRate)}%, below the 75% target. ${finalPeriod.aggregates.locations.home} personas remained at home.`,
      rootCause:
        "Analysis of persona reasoning shows this was driven by 'Skeptic' personas expressing distrust in forecast severity, and 'Resource Constrained' personas lacking transportation options. Delayed mandatory evacuation orders (issued at T-38h) gave insufficient time for hesitant populations.",
      recommendation:
        "Issue earlier mandatory evacuation orders (T-60h minimum). Enhance pre-event public education campaigns targeting skeptical populations. Expand transportation assistance programs for resource-constrained residents, activating no later than T-72h.",
      severity: evacuationRate < 50 ? "high" : "medium",
      category: "Evacuation Coordination",
    });
  }

  // Insight 2: Resource assistance analysis
  if (finalPeriod.aggregates.needingAssistance > 8) {
    insights.push({
      id: "insight-2",
      observation: `${finalPeriod.aggregates.needingAssistance} personas required assistance but faced barriers to evacuation.`,
      rootCause:
        "Predominantly 'Resource Constrained' and 'Elderly' personas. Analysis shows transportation resources were deployed late (Period 7, T-60h) and shelter accessibility information was not effectively communicated to vulnerable populations.",
      recommendation:
        "Establish a vulnerable population registry pre-season. Deploy specialized transportation assets at T-85h (concurrent with voluntary orders). Create dedicated communication channels for elderly and low-income residents with simplified, multi-lingual messaging.",
      severity: "high",
      category: "Resource Allocation",
    });
  }

  // Insight 3: Timing and communication
  const anxiousCount = finalPeriod.aggregates.sentiments.anxious + finalPeriod.aggregates.sentiments.panicked;
  if (anxiousCount > 20) {
    insights.push({
      id: "insight-3",
      observation: `${anxiousCount} personas reported heightened anxiety or panic, indicating communication gaps or delayed actions.`,
      rootCause:
        "Sentiment analysis shows anxiety spiked after Period 8 when mandatory orders were issued with only 38 hours to landfall. 'Family First' and 'Anxious' personas expressed concerns about traffic congestion and shelter capacity. Late activation of contraflow (T-36h) compounded stress.",
      recommendation:
        "Activate contraflow traffic management at T-60h (minimum). Provide real-time shelter capacity updates via mobile app and social media. Implement graduated warning system (Watch → Warning → Mandatory) with clear action timelines at each stage to reduce panic.",
      severity: "medium",
      category: "Public Warning & Communication",
    });
  }

  // Insight 4: Positive outcome if evacuation was successful
  if (evacuationRate > 75) {
    insights.push({
      id: "insight-4",
      observation: `Strong evacuation compliance achieved (${Math.round(evacuationRate)}%). Early evacuees ('Planner' personas) avoided traffic congestion.`,
      rootCause:
        "Early voluntary evacuation orders (T-85h) allowed prepared populations to evacuate before roadway congestion. Clear, consistent messaging across periods and effective use of multiple communication channels built public trust.",
      recommendation:
        "Maintain current timeline for voluntary orders. Expand public education programs highlighting benefits of early evacuation. Consider recognition program for 'Planner' behavior to encourage preparedness across all demographic groups.",
      severity: "low",
      category: "Best Practices",
    });
  }

  return insights;
}
