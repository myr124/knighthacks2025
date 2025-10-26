"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useTTXStoreV2 } from "@/lib/stores/ttxStoreV2";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  TrendingUp,
  Users,
  Activity,
  FileText,
  Search,
} from "lucide-react";

// Evacuation curves by persona type
function EvacuationCurvesByPersona() {
  const scenario = useTTXStoreV2((state) => state.scenario);
  if (!scenario) return null;

  const PERSONA_TYPES = [
    { name: "The Planner", color: "#3b82f6" },
    { name: "The Skeptic", color: "#ef4444" },
    { name: "Family First", color: "#8b5cf6" },
    { name: "Resource Constrained", color: "#f59e0b" },
    { name: "The Elderly", color: "#ec4899" },
    { name: "The Altruist", color: "#10b981" },
  ];

  // Calculate evacuation rates over time for each persona type
  const data = scenario.periodResults.map((period) => {
    const typeData: any = { period: period.periodNumber };

    PERSONA_TYPES.forEach((type) => {
      const personas = period.personaResponses.filter((p) =>
        p.personaType.includes(type.name)
      );
      const evacuated = personas.filter(
        (p) => p.location === "shelter" || p.location === "evacuating"
      ).length;
      const rate = personas.length > 0 ? (evacuated / personas.length) * 100 : 0;
      typeData[type.name] = Math.round(rate);
    });

    return typeData;
  });

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-lg mb-2">Evacuation Rates Over Time</h4>
        <p className="text-sm text-muted-foreground">
          Evacuation compliance by persona type across all operational periods
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {PERSONA_TYPES.map((type) => (
          <div key={type.name} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: type.color }}
            />
            <span className="text-sm">{type.name}</span>
          </div>
        ))}
      </div>

      {/* Simple bar chart representation */}
      <div className="space-y-3">
        {data.map((period, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Period {period.period}</span>
              <span className="text-xs text-muted-foreground">
                {scenario.periodResults[idx].operationalPeriod.label}
              </span>
            </div>
            <div className="flex gap-1 h-12">
              {PERSONA_TYPES.map((type) => {
                const value = period[type.name] || 0;
                return (
                  <div
                    key={type.name}
                    className="flex-1 relative group"
                    style={{
                      backgroundColor: type.color,
                      opacity: 0.7 + value / 100 / 3,
                      height: `${value}%`,
                      alignSelf: "flex-end",
                    }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {type.name}: {value}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Sentiment analysis timeline
function SentimentAnalysisTimeline() {
  const scenario = useTTXStoreV2((state) => state.scenario);
  if (!scenario) return null;

  const sentimentData = scenario.periodResults.map((period) => {
    const sentiments = period.aggregates.sentiments;
    const total = period.aggregates.totalPersonas;

    // Calculate average sentiment score (weighted)
    const scores = {
      calm: 1,
      concerned: 2,
      skeptical: 2,
      anxious: 3,
      panicked: 4,
      defiant: 3,
    };

    let averageScore = 0;
    Object.entries(sentiments).forEach(([sentiment, count]) => {
      averageScore += (scores[sentiment as keyof typeof scores] || 0) * count;
    });
    averageScore = averageScore / total;

    return {
      period: period.periodNumber,
      label: period.operationalPeriod.label,
      sentiments,
      averageScore,
      hasEvents:
        period.injects.length > 0 || period.eocActions.length > 0,
    };
  });

  const getSentimentColor = (score: number) => {
    if (score <= 1.5) return "bg-green-500";
    if (score <= 2.5) return "bg-yellow-500";
    if (score <= 3.5) return "bg-orange-500";
    return "bg-red-500";
  };

  const getSentimentLabel = (score: number) => {
    if (score <= 1.5) return "Calm";
    if (score <= 2.5) return "Concerned";
    if (score <= 3.5) return "Anxious";
    return "Panicked";
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-lg mb-2">
          Population Sentiment Timeline
        </h4>
        <p className="text-sm text-muted-foreground">
          Average sentiment levels and key events throughout the simulation
        </p>
      </div>

      <div className="space-y-3">
        {sentimentData.map((data, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Period {data.period}</span>
                <Badge
                  className={`${getSentimentColor(data.averageScore)} text-white`}
                >
                  {getSentimentLabel(data.averageScore)}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">{data.label}</span>
            </div>

            {data.hasEvents && (
              <div className="bg-accent/50 p-3 rounded text-xs">
                <p className="font-medium">Events in this period:</p>
                <ul className="mt-1 space-y-1">
                  {scenario.periodResults[idx].injects.map((inject) => (
                    <li key={inject.id} className="text-muted-foreground">
                      • {inject.title}
                    </li>
                  ))}
                  {scenario.periodResults[idx].eocActions.map((action) => (
                    <li key={action.id} className="text-primary">
                      • {action.details}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sentiment breakdown */}
            <div className="grid grid-cols-6 gap-2 text-xs">
              {Object.entries(data.sentiments).map(([sentiment, count]) => (
                <div key={sentiment} className="text-center">
                  <p className="font-medium">{count}</p>
                  <p className="text-muted-foreground capitalize">
                    {sentiment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Full event and persona log
function FullEventLog() {
  const scenario = useTTXStoreV2((state) => state.scenario);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<number | null>(null);

  if (!scenario) return null;

  // Flatten all persona responses
  const allResponses = scenario.periodResults.flatMap((period) =>
    period.personaResponses.map((response) => ({
      ...response,
      period: period.periodNumber,
      periodLabel: period.operationalPeriod.label,
    }))
  );

  // Filter based on search and period
  const filteredResponses = allResponses.filter((response) => {
    const matchesSearch =
      searchTerm === "" ||
      response.personaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      response.personaType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      response.reasoning.toLowerCase().includes(searchTerm.toLowerCase()) ||
      response.decision.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPeriod =
      filterPeriod === null || response.period === filterPeriod;

    return matchesSearch && matchesPeriod;
  });

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-lg mb-2">Full Event & Persona Log</h4>
        <p className="text-sm text-muted-foreground">
          Complete record of all persona actions and reasoning
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search personas, decisions, or reasoning..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="px-4 py-2 border rounded-md bg-background"
          value={filterPeriod || ""}
          onChange={(e) =>
            setFilterPeriod(e.target.value ? parseInt(e.target.value) : null)
          }
        >
          <option value="">All Periods</option>
          {scenario.periodResults.map((period) => (
            <option key={period.periodNumber} value={period.periodNumber}>
              Period {period.periodNumber}
            </option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredResponses.length} of {allResponses.length} records
      </p>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-accent sticky top-0">
              <tr>
                <th className="text-left p-3 text-sm font-semibold">Period</th>
                <th className="text-left p-3 text-sm font-semibold">Persona</th>
                <th className="text-left p-3 text-sm font-semibold">Type</th>
                <th className="text-left p-3 text-sm font-semibold">Decision</th>
                <th className="text-left p-3 text-sm font-semibold">Sentiment</th>
                <th className="text-left p-3 text-sm font-semibold">Location</th>
                <th className="text-left p-3 text-sm font-semibold">Reasoning</th>
              </tr>
            </thead>
            <tbody>
              {filteredResponses.map((response, idx) => (
                <tr key={`${response.personaId}-${response.period}`} className="border-t hover:bg-accent/50">
                  <td className="p-3 text-sm">{response.period}</td>
                  <td className="p-3 text-sm font-medium">
                    {response.personaName}
                  </td>
                  <td className="p-3 text-sm">{response.personaType}</td>
                  <td className="p-3 text-sm">
                    <Badge variant="outline">{response.decision}</Badge>
                  </td>
                  <td className="p-3 text-sm">
                    <Badge variant="outline">{response.sentiment}</Badge>
                  </td>
                  <td className="p-3 text-sm">{response.location}</td>
                  <td className="p-3 text-sm max-w-md">
                    <p className="line-clamp-2">{response.reasoning}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function DeepDiveAnalytics() {
  return (
    <Card className="p-6">
      <Tabs defaultValue="curves" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="curves">
            <TrendingUp className="h-4 w-4 mr-2" />
            Evacuation Curves
          </TabsTrigger>
          <TabsTrigger value="sentiment">
            <Activity className="h-4 w-4 mr-2" />
            Sentiment Analysis
          </TabsTrigger>
          <TabsTrigger value="logs">
            <FileText className="h-4 w-4 mr-2" />
            Event Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="curves">
          <EvacuationCurvesByPersona />
        </TabsContent>

        <TabsContent value="sentiment">
          <SentimentAnalysisTimeline />
        </TabsContent>

        <TabsContent value="logs">
          <FullEventLog />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
