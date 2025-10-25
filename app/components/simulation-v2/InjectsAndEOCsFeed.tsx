"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTTXStoreV2 } from "@/lib/stores/ttxStoreV2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, List } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Event Feed</CardTitle>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="all">
                <List className="h-4 w-4 mr-1" />
                All ({combinedEvents.length})
              </TabsTrigger>
              <TabsTrigger value="inject">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Injects ({injects.length})
              </TabsTrigger>
              <TabsTrigger value="eocAction">
                <CheckCircle className="h-4 w-4 mr-1" />
                Actions ({eocActions.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto px-3">
          <div className="space-y-3 py-2">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="flex gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => setSelectedEvent(event)}
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
              </div>
            ))}
            {filteredEvents.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-4">
                No events for this filter.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
