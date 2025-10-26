"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonaListPanel } from "./PersonaListPanel";
import { AnalyticsSummary } from "./AnalyticsSummary";
import { BarChart3, Users } from "lucide-react";

const tabVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export function TabbedSidePanel() {
  const [activeTab, setActiveTab] = useState("analytics");

  return (
    <div className="w-96 bg-background border rounded-xl flex flex-col h-full">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <motion.div
          className="border-b px-4 py-2 shrink-0"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
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
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === "analytics" && (
            <motion.div
              key="analytics"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="flex-1 overflow-y-auto"
            >
              <TabsContent value="analytics" className="m-0 h-full">
                <AnalyticsSummary />
              </TabsContent>
            </motion.div>
          )}
          {activeTab === "personas" && (
            <motion.div
              key="personas"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="flex-1 overflow-hidden"
            >
              <TabsContent value="personas" className="m-0 h-full">
                <PersonaListPanel />
              </TabsContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
