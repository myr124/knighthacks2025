'use client'
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ChevronLeft, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScenarioConfigForm } from "./ScenarioConfigForm"
import { TTXScriptReviewPanel } from "./TTXScriptReviewPanel"
import type { ScenarioConfig, Inject, EOCAction, OperationalPeriod } from '@/lib/utils/ttxGenerator';
import { ConfigDialog } from "./ConfigDialog"

const Sidebar: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'config' | 'review'>('config');
  const [config, setConfig] = useState<ScenarioConfig>({
    scenarioType: 'hurricane',
    location: 'Miami-Dade County, FL',
    severity: 'major',
    population: 2700000,
    agents: 25
  });
  const [script, setScript] = useState<{
    scenarioType: string;
    location: string;
    severity: string;
    population: number;
    periods: (OperationalPeriod & {
      injects: Inject[];
      eocActions: EOCAction[];
    })[];
  } | null>(null);

  const handleGenerate = (generatedConfig: ScenarioConfig) => {
    setConfig(generatedConfig);
    // Dummy script for demo purposes
    const dummyScript = {
      scenarioType: generatedConfig.scenarioType,
      location: generatedConfig.location,
      severity: generatedConfig.severity,
      population: generatedConfig.population,
      periods: Array.from({ length: 5 }, (_, i) => ({
        id: `op-${i+1}`,
        periodNumber: i+1,
        label: `Operational Period ${i+1}`,
        phase: (['planning', 'preparation', 'response', 'response', 'recovery'] as const)[i % 5],
        injects: [
          {
            id: `inj-${i+1}-1`,
            time: '0800',
            severity: 'medium' as const,
            type: 'weather_update',
            title: 'Storm Approaching',
            description: 'Hurricane is expected to make landfall in 24 hours.'
          }
        ],
        eocActions: [
          {
            id: `act-${i+1}-1`,
            time: '0900',
            actionType: 'public_alert' as const,
            details: 'Issue evacuation warning for coastal areas.',
            targetPopulation: '500,000 residents',
            urgency: 'voluntary' as const,
            zone: 'Zone A'
          }
        ]
      }))
    };
    setScript(dummyScript);
    setCurrentStep('review');
  };

  const handleSubmit = () => {
    // TODO: Implement backend submission
    console.log('Submitting script:', script);
    setIsDialogOpen(false);
    setCurrentStep('config');
    setScript(null);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setCurrentStep('config');
    setScript(null);
  };

  return (
    <aside className="h-screen w-72 bg-background text-foreground flex flex-col border-r border-border">
      {/* Top brand / breadcrumb */}

      <div className="px-5 pt-5 pb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <span className="opacity-80">Generate Emergency Plan</span>
      </div>

      <div className="px-5 py-2 space-y-6">
        {/* Create Session */}
        <div className="mb-4">
          <Button
            variant="outline"
            className="w-full transition-all duration-200"
            onClick={() => window.location.href = '/editor'}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Session
          </Button>
        </div>

        {/* Analysis Sessions */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div>
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2 block">Hurricane Melissa</span>
              <div className="text-sm" style={{ color: 3 < 5 ? "#ef4444" : "#6b7280" }}>
                Landfall in 3 days
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer status */}
      <div className="mt-auto px-5 pb-5 text-[12px] text-muted-foreground space-y-1">
        <div>All rights reserved</div>
        <div className="pt-2 text-[11px] opacity-60">Version 1.0</div>
      </div>
    </aside>
  );
};

export default Sidebar;