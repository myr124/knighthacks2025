"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonaListPanel } from "./PersonaListPanel";
import { AnalyticsSummary } from "./AnalyticsSummary";
import { BarChart3, Users } from "lucide-react";

export function TabbedSidePanel() {
  return (
    <div className="w-96 bg-background border rounded-xl flex flex-col h-full">
      <Tabs
        defaultValue="analytics"
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="border-b px-4 py-2 shrink-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="personas" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Personas
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="analytics" className="flex-1 m-0 overflow-y-auto">
          <AnalyticsSummary />
        </TabsContent>

        <TabsContent value="personas" className="flex-1 m-0 overflow-hidden">
          <PersonaListPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
