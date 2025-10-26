"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTTXStoreV2 } from "@/lib/stores/ttxStoreV2";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  className?: string;
}

function MetricCard({ icon, label, value, change, changeType, className }: MetricCardProps) {
  const changeColors = {
    positive: "text-green-600 bg-green-50 dark:bg-green-950",
    negative: "text-red-600 bg-red-50 dark:bg-red-950",
    neutral: "text-gray-600 bg-gray-50 dark:bg-gray-950",
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-lg bg-primary/10">
          {icon}
        </div>
        {change && (
          <Badge className={changeColors[changeType || "neutral"]}>
            {change}
          </Badge>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
    </Card>
  );
}

interface PerformanceItem {
  objective: string;
  rating: "excellent" | "good" | "challenges";
}

function PerformanceScorecard({ items }: { items: PerformanceItem[] }) {
  const getRatingBadge = (rating: PerformanceItem["rating"]) => {
    const configs = {
      excellent: {
        icon: <CheckCircle2 className="h-4 w-4" />,
        label: "Performed without Challenges",
        className: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
      },
      good: {
        icon: <Activity className="h-4 w-4" />,
        label: "Performed with Some Challenges",
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
      },
      challenges: {
        icon: <XCircle className="h-4 w-4" />,
        label: "Performed with Major Challenges",
        className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
      },
    };

    const config = configs[rating];
    return (
      <Badge className={`${config.className} flex items-center gap-1.5 px-3 py-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-lg mb-4">Performance Scorecard</h3>
      <div className="space-y-4">
        {items.map((item, index) => (
          <motion.div
            key={index}
            className="flex items-center justify-between py-3 border-b last:border-b-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <span className="font-medium">{item.objective}</span>
            {getRatingBadge(item.rating)}
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

export function ExecutiveSummaryDashboard() {
  const scenario = useTTXStoreV2((state) => state.scenario);

  if (!scenario) return null;

  // Calculate final metrics from the last period
  const finalPeriod = scenario.periodResults[scenario.periodResults.length - 1];
  const firstPeriod = scenario.periodResults[0];

  const totalEvacuated = finalPeriod.aggregates.locations.shelter +
                         finalPeriod.aggregates.locations.evacuating;
  const totalPersonas = finalPeriod.aggregates.totalPersonas;
  const evacuationRate = Math.round((totalEvacuated / totalPersonas) * 100);
  const needingAssistance = finalPeriod.aggregates.needingAssistance;
  const atHome = finalPeriod.aggregates.locations.home;

  // Calculate change from start
  const initialAtHome = firstPeriod.aggregates.locations.home;
  const evacuatedCount = initialAtHome - atHome;

  // Determine performance ratings based on metrics
  const performanceItems: PerformanceItem[] = [
    {
      objective: "Public Warning & Communication",
      rating: evacuationRate > 75 ? "excellent" : evacuationRate > 50 ? "good" : "challenges",
    },
    {
      objective: "Resource Allocation",
      rating: needingAssistance < 5 ? "excellent" : needingAssistance < 10 ? "good" : "challenges",
    },
    {
      objective: "Evacuation Coordination",
      rating: atHome < 10 ? "excellent" : atHome < 20 ? "good" : "challenges",
    },
    {
      objective: "Shelter Management",
      rating: finalPeriod.aggregates.locations.shelter > 30 ? "excellent" :
              finalPeriod.aggregates.locations.shelter > 20 ? "good" : "challenges",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Executive Summary</h2>
        <p className="text-muted-foreground">
          High-level outcomes and performance metrics from the simulation
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Users className="h-5 w-5 text-primary" />}
          label="Total Evacuated"
          value={totalEvacuated}
          change={`${evacuatedCount} from start`}
          changeType="positive"
        />
        <MetricCard
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          label="Evacuation Rate"
          value={`${evacuationRate}%`}
          change={evacuationRate > 75 ? "Excellent" : evacuationRate > 50 ? "Good" : "Needs Improvement"}
          changeType={evacuationRate > 75 ? "positive" : evacuationRate > 50 ? "neutral" : "negative"}
        />
        <MetricCard
          icon={<AlertTriangle className="h-5 w-5 text-primary" />}
          label="Need Assistance"
          value={needingAssistance}
          change={needingAssistance < 5 ? "Low" : needingAssistance < 10 ? "Moderate" : "High"}
          changeType={needingAssistance < 5 ? "positive" : needingAssistance < 10 ? "neutral" : "negative"}
        />
        <MetricCard
          icon={<AlertTriangle className="h-5 w-5 text-primary" />}
          label="Still at Home"
          value={atHome}
          change={atHome < 10 ? "Low Risk" : atHome < 20 ? "Moderate Risk" : "High Risk"}
          changeType={atHome < 10 ? "positive" : atHome < 20 ? "neutral" : "negative"}
        />
      </div>

      {/* Performance Scorecard */}
      <PerformanceScorecard items={performanceItems} />
    </div>
  );
}
