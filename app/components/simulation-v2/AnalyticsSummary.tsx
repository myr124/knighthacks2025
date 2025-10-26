"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTTXStoreV2 } from "@/lib/stores/ttxStoreV2";
import { AnimatedCounter } from "./AnimatedCounter";
import {
  Users,
  AlertTriangle,
  Home,
  TrendingUp,
  Activity,
  MapPin,
} from "lucide-react";

export function AnalyticsSummary() {
  const scenario = useTTXStoreV2((state) => state.scenario);
  const currentPeriod = useTTXStoreV2((state) => state.currentPeriod);

  if (!scenario) return null;

  const currentResult = scenario.periodResults[currentPeriod - 1];
  const aggregates = currentResult.aggregates;

  // Calculate percentages
  const evacuationRate = (
    ((aggregates.decisions.evacuate +
      aggregates.locations.evacuating +
      aggregates.locations.shelter) /
      aggregates.totalPersonas) *
    100
  ).toFixed(0);
  const atHomeRate = (
    (aggregates.locations.home / aggregates.totalPersonas) *
    100
  ).toFixed(0);
  const needsAssistanceRate = (
    (aggregates.needingAssistance / aggregates.totalPersonas) *
    100
  ).toFixed(0);

  // Sentiment breakdown
  const calmCount = aggregates.sentiments.calm || 0;
  const concernedCount = aggregates.sentiments.concerned || 0;
  const anxiousCount = aggregates.sentiments.anxious || 0;
  const panickedCount = aggregates.sentiments.panicked || 0;
  const skepticalCount = aggregates.sentiments.skeptical || 0;

  const positiveCount = calmCount;
  const neutralCount = concernedCount + skepticalCount;
  const negativeCount = anxiousCount + panickedCount;

  return (
    <div className="flex flex-col justify-between h-full p-4">
      {/* Sentiment Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Population Sentiment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div className="text-lg font-bold text-green-600">
                  <AnimatedCounter value={positiveCount} />
                </div>
                <div className="text-xs text-muted-foreground">Calm</div>
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <div className="text-lg font-bold text-yellow-600">
                  <AnimatedCounter value={neutralCount} />
                </div>
                <div className="text-xs text-muted-foreground">Neutral</div>
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <div className="text-lg font-bold text-red-600">
                  <AnimatedCounter value={negativeCount} />
                </div>
                <div className="text-xs text-muted-foreground">Distressed</div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="flex"
        >
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Total Population
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="text-2xl font-bold">
                <AnimatedCounter value={aggregates.totalPersonas} />
              </div>
              <p className="text-xs text-muted-foreground">Active personas</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="flex"
        >
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Needs Assistance
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="text-2xl font-bold">
                <AnimatedCounter value={aggregates.needingAssistance} />
              </div>
              <p className="text-xs text-muted-foreground">
                <AnimatedCounter value={Number(needsAssistanceRate)} decimals={0} />% of population
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Evacuation Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Population Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">At Home</span>
              <span className="text-sm font-medium">
                <AnimatedCounter value={aggregates.locations.home} /> (<AnimatedCounter value={Number(atHomeRate)} decimals={0} />%)
              </span>
            </div>
            <Progress value={Number(atHomeRate)} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">Evacuating</span>
              <span className="text-sm font-medium">
                <AnimatedCounter value={aggregates.locations.evacuating} />
              </span>
            </div>
            <Progress
              value={
                (aggregates.locations.evacuating / aggregates.totalPersonas) *
                100
              }
              className="h-2"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">At Shelter</span>
              <span className="text-sm font-medium">
                <AnimatedCounter value={aggregates.locations.shelter} />
              </span>
            </div>
            <Progress
              value={
                (aggregates.locations.shelter / aggregates.totalPersonas) * 100
              }
              className="h-2"
            />
          </div>

          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Evacuation Rate</span>
              <Badge variant="secondary">
                <AnimatedCounter value={Number(evacuationRate)} decimals={0} />%
              </Badge>
            </div>
          </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Critical Issues
      {aggregates.criticalIssues.length > 0 && (
        <Card className="border-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-4 w-4" />
              Critical Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {aggregates.criticalIssues.map((issue, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )} */}

      {/* Decision Breakdown
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Current Decisions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(aggregates.decisions)
              .filter(([_, count]) => count > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([decision, count]) => (
                <div
                  key={decision}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="capitalize">
                    {decision.replace("_", " ")}
                  </span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}
