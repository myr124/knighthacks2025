"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTTXStoreV2 } from "@/lib/stores/ttxStoreV2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, List } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnimatedCounter } from "./AnimatedCounter";

const getEventColor = (
  event:
    | {
        eventType: "eocAction";
        id: string;
        periodNumber: number;
        time: string;
        actionType:
          | "evacuation_order"
          | "shelter"
          | "contraflow"
          | "public_announcement"
          | "resource_deployment";
        zone?: string;
        urgency?: "voluntary" | "mandatory";
        details: string;
        targetPopulation?: string;
      }
    | {
        eventType: "inject";
        id: string;
        periodNumber: number;
        time: string;
        type:
          | "weather_update"
          | "forecast_change"
          | "infrastructure"
          | "media"
          | "public_behavior";
        title: string;
        description: string;
        severity: "low" | "medium" | "high" | "critical";
      }
) => {
  if (event.eventType === "inject") {
    switch (event.severity) {
      case "low":
        return "bg-blue-500";
      case "medium":
        return "bg-yellow-500";
      case "high":
        return "bg-orange-500";
      case "critical":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  } else {
    // eocAction
    switch (event.urgency) {
      case "voluntary":
        return "bg-green-500";
      case "mandatory":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  }
};

export function InjectsAndEOCsFeed() {
  const [filter, setFilter] = useState("all"); // 'all', 'inject', 'eocAction'
  const scenario = useTTXStoreV2((state) => state.scenario);
  const currentPeriod = useTTXStoreV2((state) => state.currentPeriod);
  const setSelectedEvent = useTTXStoreV2((state) => state.setSelectedEvent);

  if (!scenario) return null;

  const currentResult = scenario.periodResults[currentPeriod - 1];
  const injects = currentResult.injects.map((i) => ({
    ...i,
    eventType: "inject" as const,
  }));
  const eocActions = currentResult.eocActions.map((a) => ({
    ...a,
    eventType: "eocAction" as const,
  }));

  const combinedEvents = [...injects, ...eocActions].sort((a, b) => {
    return b.time.localeCompare(a.time);
  });

  const filteredEvents = combinedEvents.filter((event) => {
    if (filter === "all") return true;
    return event.eventType === filter;
  });

  return (
    <div className="h-full flex flex-col bg-background border rounded-xl">
      <div className="p-2 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium px-2">Event Feed</h3>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="all">
                <List className="h-4 w-4 mr-1" />
                All (<AnimatedCounter value={combinedEvents.length} duration={0.3} />)
              </TabsTrigger>
              <TabsTrigger value="inject">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Injects (<AnimatedCounter value={injects.length} duration={0.3} />)
              </TabsTrigger>
              <TabsTrigger value="eocAction">
                <CheckCircle className="h-4 w-4 mr-1" />
                Actions (<AnimatedCounter value={eocActions.length} duration={0.3} />)
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      <div className="p-0 flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto px-3">
          <div className="space-y-3 py-2">
            <AnimatePresence mode="popLayout">
              {filteredEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  layout
                  className="flex gap-3 p-2 rounded-lg bg-accent hover:bg-accent/80 transition-colors cursor-pointer"
                  onClick={() => setSelectedEvent(event)}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className={`w-1 rounded-full ${getEventColor(
                      event
                    )} flex-shrink-0`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono py-0 h-4"
                      >
                        {event.time}
                      </Badge>
                      <Badge
                        variant={
                          event.eventType === "inject" ? "default" : "secondary"
                        }
                        className="text-xs px-1.5 py-0"
                      >
                        {event.eventType === "inject" ? "INJECT" : "EOC ACTION"}
                      </Badge>
                    </div>
                    <p className="text-sm leading-tight font-medium">
                      {event.eventType === "inject" ? event.title : event.details}{" "}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredEvents.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-sm text-muted-foreground py-4"
              >
                No events for this filter.
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
