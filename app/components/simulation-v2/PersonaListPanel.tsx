"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTTXStoreV2 } from "@/lib/stores/ttxStoreV2";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getDemographicLabel } from "@/lib/utils/personaDemographics";
import { AnimatedCounter } from "./AnimatedCounter";
import { ElevenLabsCallModal } from "./ElevenLabsCallModal";
import type { PersonaResponse } from "@/lib/types/ttx";
import { Users, Filter, X, Phone } from "lucide-react";

const SENTIMENT_COLORS: Record<PersonaResponse["sentiment"], string> = {
  calm: "bg-green-500",
  concerned: "bg-yellow-500",
  anxious: "bg-orange-500",
  panicked: "bg-red-500",
  skeptical: "bg-purple-500",
  defiant: "bg-pink-500",
};

const LOCATION_COLORS: Record<PersonaResponse["location"], string> = {
  home: "border-gray-500",
  evacuating: "border-orange-500",
  shelter: "border-green-500",
  with_family: "border-blue-500",
  helping_others: "border-purple-500",
};

export function PersonaListPanel() {
  const scenario = useTTXStoreV2((state) => state.scenario);
  const currentPeriod = useTTXStoreV2((state) => state.currentPeriod);
  const setSelectedPersona = useTTXStoreV2((state) => state.setSelectedPersona);

  const [filters, setFilters] = useState({
    sentiment: "all",
    location: "all",
    trustInGovernment: "all",
    socialStatus: "all",
    needsAssistance: "all",
  });

  // State for ElevenLabs call modal
  const [callPersona, setCallPersona] = useState<PersonaResponse | null>(null);

  if (!scenario) return null;

  const currentResult = scenario.periodResults[currentPeriod - 1];

  // Safety check for undefined currentResult
  if (!currentResult) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-sm text-muted-foreground">Loading persona data...</p>
      </div>
    );
  }

  const personas = currentResult.personaResponses;

  // Apply filters
  const filteredPersonas = useMemo(() => {
    return personas.filter((persona) => {
      if (
        filters.sentiment !== "all" &&
        persona.sentiment !== filters.sentiment
      )
        return false;
      if (filters.location !== "all" && persona.location !== filters.location)
        return false;
      if (
        filters.trustInGovernment !== "all" &&
        persona.demographics.trustInGovernment !== filters.trustInGovernment
      )
        return false;
      if (
        filters.socialStatus !== "all" &&
        persona.demographics.socialStatus !== filters.socialStatus
      )
        return false;
      if (filters.needsAssistance !== "all") {
        const needsHelp = filters.needsAssistance === "true";
        if (persona.needsAssistance !== needsHelp) return false;
      }
      return true;
    });
  }, [personas, filters]);

  const clearFilters = () => {
    setFilters({
      sentiment: "all",
      location: "all",
      trustInGovernment: "all",
      socialStatus: "all",
      needsAssistance: "all",
    });
  };

  const hasActiveFilters = Object.values(filters).some((f) => f !== "all");

  // Count by sentiment
  const sentimentCounts = personas.reduce((acc, p) => {
    acc[p.sentiment] = (acc[p.sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-accent/20">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline">
            {filteredPersonas.length} / {personas.length} personas
          </Badge>
        </div>

        {/* Sentiment Distribution */}
        <div className="grid grid-cols-3 gap-1 text-xs">
          {Object.entries(sentimentCounts).map(([sentiment, count]) => (
            <div key={sentiment} className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  SENTIMENT_COLORS[sentiment as PersonaResponse["sentiment"]]
                }`}
              />
              <span className="capitalize">{sentiment}</span>
              <span className="text-muted-foreground">
                (<AnimatedCounter value={count} />)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 border-b">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="filters">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Filter Personas</span>
                {hasActiveFilters && (
                  <Badge variant="secondary">
                    {Object.values(filters).filter((f) => f !== "all").length}{" "}
                    active
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={filters.sentiment}
                    onValueChange={(v) =>
                      setFilters({ ...filters, sentiment: v })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Sentiment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sentiments</SelectItem>
                      <SelectItem value="calm">Calm</SelectItem>
                      <SelectItem value="concerned">Concerned</SelectItem>
                      <SelectItem value="anxious">Anxious</SelectItem>
                      <SelectItem value="panicked">Panicked</SelectItem>
                      <SelectItem value="skeptical">Skeptical</SelectItem>
                      <SelectItem value="defiant">Defiant</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.location}
                    onValueChange={(v) =>
                      setFilters({ ...filters, location: v })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="home">At Home</SelectItem>
                      <SelectItem value="evacuating">Evacuating</SelectItem>
                      <SelectItem value="shelter">Sheltered</SelectItem>
                      <SelectItem value="with_family">With Family</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.trustInGovernment}
                    onValueChange={(v) =>
                      setFilters({ ...filters, trustInGovernment: v })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Trust" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Trust Levels</SelectItem>
                      <SelectItem value="low">Low Trust</SelectItem>
                      <SelectItem value="medium">Medium Trust</SelectItem>
                      <SelectItem value="high">High Trust</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.socialStatus}
                    onValueChange={(v) =>
                      setFilters({ ...filters, socialStatus: v })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Income" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Income</SelectItem>
                      <SelectItem value="low_income">Low Income</SelectItem>
                      <SelectItem value="middle_income">
                        Middle Income
                      </SelectItem>
                      <SelectItem value="high_income">High Income</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.needsAssistance}
                    onValueChange={(v) =>
                      setFilters({ ...filters, needsAssistance: v })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs col-span-2">
                      <SelectValue placeholder="Needs Help" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Personas</SelectItem>
                      <SelectItem value="true">Needs Assistance</SelectItem>
                      <SelectItem value="false">
                        No Assistance Needed
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear All Filters
                  </Button>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Persona List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredPersonas.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center text-sm text-muted-foreground py-8"
              >
                No personas match current filters
              </motion.div>
            ) : (
              filteredPersonas.map((persona, index) => (
                <motion.div
                  key={persona.personaId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                  layout
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={`hover:shadow-md transition-shadow border-l-4 ${
                      LOCATION_COLORS[persona.location]
                    }`}
                  >
                    <CardContent className="p-3">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => setSelectedPersona(persona.personaId)}
                        >
                          <h4 className="font-medium text-sm truncate">
                            {persona.personaName}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {persona.personaType}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCallPersona(persona);
                            }}
                            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                            title="Call Persona"
                          >
                            <Phone className="h-4 w-4" />
                          </button>
                          <Badge
                            className={`${
                              SENTIMENT_COLORS[persona.sentiment]
                            } text-white text-xs`}
                          >
                            {persona.sentiment}
                          </Badge>
                        </div>
                      </div>

                      {/* Demographics */}
                      <div
                        className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs mb-2 cursor-pointer"
                        onClick={() => setSelectedPersona(persona.personaId)}
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Age:</span>
                          <span>{persona.demographics.age}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Race:</span>
                          <span className="capitalize">
                            {persona.demographics.race}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Income:</span>
                          <span>
                            {
                              getDemographicLabel(
                                "socialStatus",
                                persona.demographics.socialStatus
                              ).split(" ")[0]
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Trust:</span>
                          <span>
                            {
                              getDemographicLabel(
                                "trustInGovernment",
                                persona.demographics.trustInGovernment
                              ).split(" ")[0]
                            }
                          </span>
                        </div>
                      </div>

                      {/* Decision & Location */}
                      <div
                        className="flex items-center gap-2 text-xs cursor-pointer"
                        onClick={() => setSelectedPersona(persona.personaId)}
                      >
                        <Badge variant="outline" className="capitalize">
                          {persona.decision.replace("_", " ")}
                        </Badge>
                        <Badge variant="secondary" className="capitalize">
                          {persona.location.replace("_", " ")}
                        </Badge>
                        {persona.needsAssistance && (
                          <Badge variant="destructive" className="text-xs">
                            Help Needed
                          </Badge>
                        )}
                      </div>

                      {/* Reasoning Preview */}
                      <p
                        className="text-xs text-muted-foreground mt-2 line-clamp-2 cursor-pointer"
                        onClick={() => setSelectedPersona(persona.personaId)}
                      >
                        {persona.reasoning}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* ElevenLabs Call Modal */}
      <ElevenLabsCallModal
        persona={callPersona}
        actionContext={currentResult?.operationalPeriod || null}
        isOpen={!!callPersona}
        onClose={() => setCallPersona(null)}
      />
    </div>
  );
}
